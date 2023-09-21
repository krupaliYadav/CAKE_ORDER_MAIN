const formidable = require("formidable")
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const User = require("../../models/userModel")
const Order = require("../../models/order")
const Address = require("../../models/address")
const { HTTP_STATUS_CODE, DEFAULT_PROFILE_IMG, PATH_END_POINT } = require("../../helper/constants.helper")
const { BadRequestException } = require("../../common/exceptions/index");
const path = require("path");
const { mongoose } = require("mongoose");

// get user profile details
const getProfile = async (req, res) => {
    const userId = req.user
    const data = await User.findOne({ _id: userId, isDeleted: 0 }).select('firstName lastName email phoneNumber image isActive')

    if (!data) {
        throw new BadRequestException("User details not found ")
    }
    if (data?.image) {
        data.image = `${PATH_END_POINT.userProfileImage}${data.image}`
    }
    const totalNumOfOrders = await Order.countDocuments({ userId: userId })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User details load successfully", data: { data, totalNumOfOrders } })
}

// update user profile
const updateProfile = async (req, res) => {
    const userId = req.user
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { email, phoneNumber } = fields
            const user = await User.findById(userId)
            // check email is exits or not
            if (email) {
                const isEmailExists = await User.findOne({ email: email });
                if (isEmailExists !== null && isEmailExists?._id.toString() !== userId) {
                    return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "Email is already exits" });
                } else {
                    fields.email = email
                }
            }
            // check phone number is exits or not
            if (phoneNumber) {
                const isPhoneNumberExists = await User.findOne({ phoneNumber: phoneNumber });
                if (isPhoneNumberExists !== null && isPhoneNumberExists?._id.toString() !== userId) {
                    return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "This phone number already exists! Use a different phone number" });
                } else {
                    fields.phoneNumber = phoneNumber
                }
            }

            // if profileImage
            if (files.image) {
                const { mimetype } = files.image;
                const img = mimetype.split("/");
                const extension = img[1].toLowerCase();

                if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed..` });
                };

                const fileName = (files.image.originalFilename =
                    uuidv4() + "." + extension);
                const newPath = path.resolve(__dirname, "../../" + `/public/profile/${fileName}`);

                fields.image = fileName
                fs.copyFile(files.image.filepath, newPath, async (err) => {
                    if (err) {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                    }

                    const publicPathFileName = path.resolve(__dirname, "../../" + "/public/profile/")

                    if (user.image !== DEFAULT_PROFILE_IMG.image) {
                        if (fs.existsSync(`${publicPathFileName}/${user.image}`)) {
                            // Delete the file from the upload folder
                            fs.unlink(`${publicPathFileName}/${user.image}`, (err) => {
                                if (err) {
                                    console.log('Error deleting file:', err);
                                } else {
                                    console.log("delete file form public folder successfully");
                                }
                            })
                        }
                    }

                });
            };
            await User.updateOne({ _id: userId }, fields)
            return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User profile update successfully" })

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

// add new address
const addAddress = async (req, res) => {
    const userId = req.user
    let { lat, long, address } = req.body
    await Address.create({ userId: userId, lat, long, address })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Address add successfully" })
}

// get user all address
const getAllAddressList = async (req, res) => {
    const userId = req.user
    const data = await Address.find({ userId: userId, isDeleted: 0 }).select('userId lat long address')
    if (!data) {
        throw new BadRequestException("User address details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User address list load successfully", data })
}

//update user address
const updateAddress = async (req, res) => {
    const userId = req.user
    const { addressId } = req.params
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        throw new BadRequestException("Please enter valid address Id");
    }

    const address = await Address.findOne({ _id: addressId, userId: userId })
    if (address) {
        await Address.updateOne({ _id: addressId, userId: userId }, req.body,)
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Address update successfully" })
    } else {
        throw new BadRequestException("Address details not found")
    }
}

// delete address
const deleteAddress = async (req, res) => {
    const userId = req.user
    const { addressId } = req.params
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        throw new BadRequestException("Please enter valid address Id");
    }

    const address = await Address.findOne({ _id: addressId, userId: userId })
    if (address) {
        await Address.updateOne({ _id: addressId, userId: userId }, { isDeleted: 1 })
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Address deleted successfully" })
    } else {
        throw new BadRequestException("Address details not found")
    }
}


module.exports = {
    getProfile,
    updateProfile,
    getAllAddressList,
    addAddress,
    updateAddress,
    deleteAddress,
}