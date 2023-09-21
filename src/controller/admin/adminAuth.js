const Admin = require("../../models/admin")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const { BadRequestException } = require("../../common/exceptions/index")

// admin login
const login = async (req, res) => {
    let { email, password } = req.body
    const admin = await Admin.findOne({ email: email })

    if (!admin || !bcrypt.compareSync(password, admin?.password)) {
        throw new BadRequestException("Invalid email or password")
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
module.exports = {
    login,
    getProfile
}