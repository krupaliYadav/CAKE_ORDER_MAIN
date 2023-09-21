const Order = require("../../models/order")
const mongoose = require("mongoose")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")
const { BadRequestException, ConflictRequestException } = require("../../common/exceptions/index")

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
        {
            $addFields:
            {
                variantDetails: {
                    $filter: {
                        input: '$cake.variant',
                        as: 'cakeVariant',
                        cond: {
                            $and: [
                                { $eq: ['$$cakeVariant.variantId', "$variantId"] },
                            ]
                        }
                    }
                },
            },
        },
        { $unwind: "$variantDetails" },
        {
            $lookup: {
                from: 'variants',
                localField: 'variantDetails.variantId',
                foreignField: "_id",
                as: 'variantData',
                pipeline: [
                    { $project: { name: 1, isActive: 1 } },

                ],
            }
        },
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
                selectedVariant: {
                    _id: { $arrayElemAt: ["$variantData._id", 0] },
                    name: { $arrayElemAt: ["$variantData.name", 0] },
                    price: "$variantDetails.variantPrice"
                },
                orderDetails: {
                    nameOnCake: { $ifNull: ["$nameOnCake", null] },
                    orderDateTime: { $ifNull: ["$dateTime", null] },
                    orderStatus: "$status",
                    orderType: 1,
                    orderId: 1,
                    note: { $ifNull: ["$note", null] },
                    altPhoneNumber: { $cond: [{ $ne: ["$altPhoneNumber", ""] }, "$altPhoneNumber", null] },
                    isReviewed: 1,
                    isCustom: 1,
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

    const order = await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: status } })

    if (!order) {
        throw new BadRequestException("Order details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Order status update successfully" });

}

module.exports = {
    getOrderList,
    changeOrderStatus
}