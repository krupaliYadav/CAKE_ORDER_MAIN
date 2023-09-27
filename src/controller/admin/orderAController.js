const Order = require("../../models/order")
const User = require("../../models/userModel")
const Cake = require("../../models/cake")
const mongoose = require("mongoose")
const { HTTP_STATUS_CODE, PATH_END_POINT, notificationMSGs } = require("../../helper/constants.helper")
const { BadRequestException } = require("../../common/exceptions/index")
const { fcmNotification, inAppNotification } = require("../../helper/fcmNotification.helper")

const getOrderList = async (req, res) => {
    let { limit, offset, search, orderId } = req.query
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;
    let mainQuery = { isDeleted: 0, }
    let subQuery = {}

    if (search) {
        subQuery.$or = [
            { "cake.name": { $regex: search, $options: 'i' } },
            { dateTime: { $regex: search, $options: 'i' } },
            { "user.firstName": { $regex: search, $options: 'i' } },
        ];
    }
    if (orderId) {
        mainQuery = { ...mainQuery, _id: new mongoose.Types.ObjectId(orderId) }
    }

    let data = await Order.aggregate([
        { $match: mainQuery },
        {
            $addFields: {
                dateTime: {
                    $toString: "$dateTime"
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                as: 'user',
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } },
                ]
            }
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: 'cakes',
                localField: 'cakeId',
                foreignField: "_id",
                as: 'cake',
                pipeline: [
                    { $project: { name: 1, price: 1, description: 1, image: 1, variant: 1 } },
                ]
            }
        },
        { $unwind: "$cake" },
        // {
        //     $addFields:
        //     {
        //         variantDetails: {
        //             $filter: {
        //                 input: '$cake.variant',
        //                 as: 'cakeVariant',
        //                 cond: {
        //                     $and: [
        //                         { $eq: ['$$cakeVariant.variantId', "$variantId"] },
        //                     ]
        //                 }
        //             }
        //         },
        //     },
        // },
        // { $unwind: "$variantDetails" },
        // {
        //     $lookup: {
        //         from: 'variants',
        //         localField: 'variantDetails.variantId',
        //         foreignField: "_id",
        //         as: 'variantData',
        //         pipeline: [
        //             { $project: { name: 1, isActive: 1 } },

        //         ],
        //     }
        // },
        {
            $lookup: {
                from: 'addresses',
                localField: 'addressId',
                foreignField: "_id",
                as: 'address',
                pipeline: [
                    { $project: { address: 1 } },

                ],
            }
        },
        { $unwind: "$address" },
        { $match: subQuery },
        {
            $project: {
                _id: 1,
                userDetails: {
                    _id: "$user._id",
                    firstName: "$user.firstName",
                    lastName: "$user.lastName",
                    email: "$user.email",
                    phoneNumber: "$user.phoneNumber",
                },
                cakeDetails: {
                    cakeId: "$cake._id",
                    cakeName: "$cake.name",
                    cakePrice: "$cake.price",
                    cakeDescription: { $ifNull: ["$cake.description", null] },
                    cakeImages: "$cake.image",

                },
                address: 1,
                // selectedVariant: {
                //     _id: { $arrayElemAt: ["$variantData._id", 0] },
                //     name: { $arrayElemAt: ["$variantData.name", 0] },
                //     price: "$variantDetails.variantPrice"
                // },
                selectedVariant: "$variant",
                orderDetails: {
                    nameOnCake: { $ifNull: ["$nameOnCake", null] },
                    orderDateTime: { $ifNull: ["$dateTime", null] },
                    orderStatus: "$status",
                    orderType: "$orderType",
                    orderId: "$orderId",
                    note: { $ifNull: ["$note", null] },
                    altPhoneNumber: { $cond: [{ $ne: ["$altPhoneNumber", ""] }, "$altPhoneNumber", null] },
                    isReviewed: "$isReviewed",
                    isCustom: "$isCustom",
                    customImage: { $ifNull: ["$image", null] },
                }
            }
        }
    ]);

    if (data.length !== 0) {
        data.map((item) => {
            item.cakeDetails.cakeImages = item?.cakeDetails?.cakeImages.map((imageName) => PATH_END_POINT.cakeImage + imageName);
            item.orderDetails.customImage = item?.orderDetails?.customImage.map((imageName) => PATH_END_POINT.customCakeImg + imageName);
            return item.cakeDetails.cakeImages, item.orderDetails.customImage
        })
    }

    const totalCount = await Order.countDocuments({ isDeleted: 0 })
    const filterCount = data.length
    data = data.slice(offsetData, limitData + offsetData);
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Order details load successfully", data: { totalCount, filterCount, data } });

}

// change status 
const changeOrderStatus = async (req, res) => {
    let { orderId, status } = req.body
    if (!orderId) {
        throw new BadRequestException("OrderId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException("Please Enter Valid order Id")
    }
    if (!status) {
        throw new BadRequestException("Status is required")
    }
    if (![0, 1, 2, 3, 4].includes(status)) {
        throw new BadRequestException('Invalid status value')
    }
    const statusMapping = {
        0: "Pending",
        1: "Accepted",
        2: "Cancelled",
        3: "InProgress",
        4: "Completed"
    };
    const order = await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: status } })
    // push notification and in app notification
    const userData = await User.findById({ _id: order.userId })
    if (order !== null && userData.deviceToken && userData.deviceToken !== null) {
        const deviceIds = [];
        if (userData.firebaseToken !== null) {
            deviceIds.push(userData.firebaseToken);
        }
        if (deviceIds.length > 0) {
            let cakeDetails = await Cake.findById({ _id: order?.cakeId })
            const statusString = statusMapping[status] || "unknown";
            let message = notificationMSGs.orderStatusUpdate(cakeDetails.name, statusString)
            fcmNotification({ message: message, deviceIds });
            await inAppNotification({ userId: order.userId, orderId: order._id, title: message.title, message: message.message })
        }
    }
    if (!order) {
        throw new BadRequestException("Order details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Order status update successfully" });

}

module.exports = {
    getOrderList,
    changeOrderStatus
}