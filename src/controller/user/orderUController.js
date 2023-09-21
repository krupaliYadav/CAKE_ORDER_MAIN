const Cake = require("../../models/cake")
const Order = require("../../models/order")
const Address = require("../../models/address")
const mongoose = require("mongoose")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const { HTTP_STATUS_CODE, PATH_END_POINT, ORDER_ID } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
const { placeOrderValidation } = require("../../common/validation")

const placeOrder = async (req, res) => {
    const userId = req.user
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { cakeId, variantId, orderId, addressId, isCustom, nameOnCake, orderType, image, dateTime, altPhoneNumber, note, status, isReviewed } = fields
            isCustom = isCustom || '0'

            // validation
            const validation = placeOrderValidation.filter(field => !fields[field]);
            if (validation.length > 0) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: `${validation.join(', ')} is required` })
            }

            if (!mongoose.Types.ObjectId.isValid(cakeId) || !mongoose.Types.ObjectId.isValid(variantId) || !mongoose.Types.ObjectId.isValid(addressId)) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please Enter valid IDs" });
            }

            // check ids exits or not
            const isCakeExits = await Cake.findOne({ _id: cakeId, isDeleted: 0, isActive: 1 })
            if (!isCakeExits) return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'CakeId dose not exits..!' })

            const isVariantExits = await Cake.findOne({ _id: cakeId, variant: { $elemMatch: { variantId: variantId } } })
            if (!isVariantExits) return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'This variant dose not exits in this cake..!' })

            const isAddressExits = await Address.findOne({ _id: addressId, userId: userId })
            if (!isAddressExits) return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'This address dose not exits for this user..!' })

            const uuid = uuidv4().replace(/-/g, ''); // Remove hyphens from UUID
            orderId = ORDER_ID + uuid.slice(0, 6);

            let setData = {
                userId: userId,
                cakeId: cakeId,
                variantId: variantId,
                orderId: orderId,
                addressId: addressId,
                isCustom: isCustom || 0,
                nameOnCake: nameOnCake || '',
                orderType: orderType,
                altPhoneNumber: altPhoneNumber || '',
                note: note || ''
            }

            if ((isCustom === '0' && orderType === "1") || (isCustom === "1" && orderType === "1")) {
                if (!dateTime) {
                    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'Delivery date and time is required' })
                }
                setData.dateTime = dateTime
            }

            if (orderType === "2" || (isCustom === "1" && orderType === "1") || (isCustom === "1" && orderType === "2")) {
                if (files.image) {
                    files.image = Array.isArray(files.image) ? files.image : [files.image];
                    const validExtensions = ["jpeg", "jpg", "png"];
                    const imgDataPromises = files.image.map(async newImg => {
                        const imgName = newImg.originalFilename.split(".");
                        const extension = imgName[imgName.length - 1].toLowerCase();

                        if (!validExtensions.includes(extension)) {
                            throw new Error(`${extension} is not allowed.`);
                        }

                        const fileName = uuidv4() + "." + extension;
                        const newPath = path.resolve(__dirname, "../../" + `/public/customCake/${fileName}`);

                        return new Promise((resolve, reject) => {
                            fs.copyFile(newImg.filepath, newPath, async (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(fileName);
                                }
                            });
                        });
                    });

                    const imgData = await Promise.all(imgDataPromises);
                    setData.image = imgData;
                } else {
                    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Cake image is required" });
                }
            }

            await Order.create(setData)
            return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Order place successfully" });

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

const getMyAllOrders = async (req, res) => {
    const userId = req.user

    let { orderId } = req.query
    let query = { isDeleted: 0, userId: new mongoose.Types.ObjectId(userId) }
    if (orderId) {
        query = { ...query, _id: new mongoose.Types.ObjectId(orderId) }
    }

    let data = await Order.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: "_id",
                as: 'user',
                pipeline: [
                    { $project: { phoneNumber: 1 } },
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
        {
            $project: {
                _id: 1,
                nameOnCake: { $ifNull: ["$nameOnCake", null] },
                orderDateTime: { $ifNull: ["$dateTime", null] },
                orderStatus: "$status",
                orderType: 1,
                note: { $ifNull: ["$note", null] },
                phoneNumber: { $cond: [{ $ne: ["$altPhoneNumber", ""] }, "$altPhoneNumber", "$user.phoneNumber"] },
                cakeId: "$cake._id",
                cakeName: "$cake.name",
                cakePrice: "$cake.price",
                cakeImages: "$cake.image",
                cakeDescription: { $ifNull: ["$cake.description", null] },
                isReviewed: 1,
                isCustom: 1,
                address: 1,
                customImage: { $ifNull: ["$image", null] },
                selectedVariant: {
                    _id: { $arrayElemAt: ["$variantData._id", 0] },
                    name: { $arrayElemAt: ["$variantData.name", 0] },
                    price: "$variantDetails.variantPrice"
                }

            }
        }
    ]);
    if (data.length !== 0) {
        data.map((item) => {
            item.cakeImages = item?.cakeImages.map((imageName) => PATH_END_POINT.cakeImage + imageName);
            item.customImage = item?.customImage.map((imageName) => PATH_END_POINT.customCakeImg + imageName);
            return item.cakeImages, item.customImage
        })
    }

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Order details load successfully", data: { data } });

}

module.exports = {
    placeOrder,
    getMyAllOrders
}