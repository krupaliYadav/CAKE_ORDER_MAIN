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
const { BadRequestException } = require("../../common/exceptions/index")


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

module.exports = {
    placeOrder
}