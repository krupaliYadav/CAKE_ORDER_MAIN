const Admin = require("../../models/admin")
const FcmNotification = require("../../models/adminFcmNotification")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const { BadRequestException } = require("../../common/exceptions/index")

// admin login
const login = async (req, res) => {
    let { email, password, deviceToken, firebaseToken } = req.body
    const admin = await Admin.findOne({ email: email })

    if (!admin || !bcrypt.compareSync(password, admin?.password)) {
        throw new BadRequestException("Invalid email or password")
    }
    if (admin) {
        // add firebase tokens
        if (deviceToken && firebaseToken) {
            const fcmTokenExists = await FcmNotification.findOne({ adminId: admin._id, deviceToken });
            if (fcmTokenExists) {
                fcmTokenExists.firebaseToken = firebaseToken;
                await fcmTokenExists.save();
            } else {
                await FcmNotification.create({
                    adminId: admin._id,
                    deviceToken,
                    firebaseToken
                });
            }
        }
    }
    const token = jwt.sign({ id: admin?.id }, process.env.JWT_SEC, { expiresIn: process.env.JWT_EXPIRES })
    res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Login SuccessFully..", data: { adminId: admin?._id, token } });
}

// get admin profile details
const getProfile = async (req, res) => {
    const adminId = req.admin
    const data = await Admin.findOne({ _id: adminId, isDeleted: 0 }).select('name email phoneNumber address')

    if (!data) {
        throw new BadRequestException("Admin details not found ")
    }

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Admin details load successfully", data })
}

// For logout
const handleLogOut = async (req, res) => {
    const { deviceToken } = req.body;
    const adminId = req.admin;
    if (!deviceToken) {
        throw new BadRequestException("device token is required")
    }

    const admin = await FcmNotification.findOne({ adminId: adminId, deviceToken: deviceToken });
    if (admin?.firebaseToken) {
        admin.firebaseToken = null
        await admin.save()
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Logout successfully." });
}

module.exports = {
    login,
    getProfile,
    handleLogOut
}