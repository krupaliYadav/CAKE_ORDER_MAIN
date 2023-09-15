const User = require("../../models/userModel")
const Address = require("../../models/address")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const { HTTP_STATUS_CODE, DEFAULT_PROFILE_IMG } = require("../../helper/constants.helper")
const { BadRequestException, ConflictRequestException, NotFoundRequestException } = require("../../common/exceptions/index")

// user registration
const register = async (req, res) => {
    let { firstName, lastName, email, password, phoneNumber, lat, long, address, deviceToken, firebaseToken } = req.body
    const user = await User.findOne({ email: email, isDeleted: 0 })
    if (user) {
        throw new ConflictRequestException("An account already exists with this email address.")
    }

    const isPhoneNumber = await User.findOne({ phoneNumber: phoneNumber, isDeleted: 0 })
    if (isPhoneNumber) {
        throw new ConflictRequestException("This phone number already exists! Use a different phone number")
    }
    password = bcrypt.hashSync(password, 10)

    const newUser = await User.create({ firstName, lastName, email, password, phoneNumber, image: DEFAULT_PROFILE_IMG.image, deviceToken, firebaseToken })

    // add address in address table
    if (address && lat && long && newUser?._id) {
        await Address.create({
            userId: newUser?._id, lat, long, address
        })
    }

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SEC, { expiresIn: process.env.JWT_EXPIRES })
    return res.status(HTTP_STATUS_CODE.CREATED).json({ status: HTTP_STATUS_CODE.CREATED, success: true, message: "Register SuccessFully..", data: { userID: newUser?._id, token } });
}

// user login
const login = async (req, res) => {
    let { email, password, deviceToken, firebaseToken } = req.body

    const isActiveUser = await User.findOne({ email: email, isActive: 1 })
    if (!isActiveUser) {
        throw new BadRequestException("Access denied")
    }
    const user = await User.findOne({ email: email })

    if (!user || !bcrypt.compareSync(password, user?.password)) {
        throw new BadRequestException("Invalid email or password")
    }

    if (deviceToken && firebaseToken) {
        if (user?.deviceToken === deviceToken) {
            user.firebaseToken = firebaseToken
            await user.save()
        } else {
            user.deviceToken = deviceToken
            user.firebaseToken = firebaseToken
            await user.save()

        }
    }
    const token = jwt.sign({ id: user?.id }, process.env.JWT_SEC, { expiresIn: process.env.JWT_EXPIRES })
    res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Login SuccessFully..", data: { userID: user?._id, token } });
}

// Forgot Password
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new BadRequestException("Please Enter Valid Email.");
    }

    const user = await User.findOne({ email: email, isActive: 1 });

    if (user) {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }

        // send mail
        // await forgotPasswordMail({ OTP, email });

        user.resetPasswordToken = OTP;
        await user.save();
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "OTP send successfully for reset password", data: { OTP } });
    } else {
        throw new BadRequestException("Invalid email send");
    }
}

// verify OTP for reset Password
const verifyOTP = async (req, res) => {
    const { email, OTP } = req.body;

    const user = await User.findOne({ email: email, resetPasswordToken: OTP });
    if (!user) {
        throw new BadRequestException("Invalid OTP  Or email")
    }
    const userId = user.id
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "OTP verification done successfully", data: { userId } })
}

// reset password
const resetPassword = async (req, res) => {
    let { userId, password } = req.body
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new BadRequestException("Please enter valid user Id");
    }
    const user = await User.findOne({ _id: userId, isActive: 1 })

    if (user && user.resetPasswordToken !== null) {
        user.password = bcrypt.hashSync(password, 10)
        user.resetPasswordToken = null
        await user.save()
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Reset Password SuccessFully.." });
    } else {
        throw new NotFoundRequestException("User not match")
    }
}

// change password
const changePassword = async (req, res) => {
    const userId = req.user
    let { oldPassword, newPassword } = req.body
    const user = await User.findOne({ _id: userId })

    if (user) {
        if (bcrypt.compareSync(oldPassword, user.password)) {
            newPassword = bcrypt.hashSync(newPassword, 10)
            user.password = newPassword
            await user.save()
            return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Change Password SuccessFully.." });

        } else {
            throw new BadRequestException("Old password not match")
        }
    } else {
        throw new BadRequestException("User details not found")
    }
}

// For logout
const handleLogOut = async (req, res) => {
    const { deviceToken } = req.body;
    const userId = req.user;
    if (!deviceToken) {
        throw new BadRequestException("device token is required")
    }

    const user = await User.findOne({ _id: userId, isDeleted: 0, isActive: 1, deviceToken: deviceToken });
    if (user?.firebaseToken) {
        user.firebaseToken = null
        await user.save()
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, message: "user logout successfully." });
}

module.exports = {
    register,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword,
    changePassword,
    handleLogOut
}