const User = require("../../models/userModel")
const Admin = require("../../models/admin")
const jwt = require("jsonwebtoken")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const headers = req.headers.authorization;
        if (!headers) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please login to access this resource" });
        }

        const token = headers.split(" ")[1];
        if (!token) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please Enter valid Token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SEC);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Token is expired or Invalid." });
        }
        req.user = decoded.id

        next();

    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message });
    }

}

exports.isAuthenticatedAdmin = async (req, res, next) => {
    try {
        const headers = req.headers.authorization;
        if (!headers) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please login to access this resource" });
        }

        const token = headers.split(" ")[1];
        if (!token) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please Enter valid Token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SEC);

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Token is expired or Invalid." });
        }
        req.admin = decoded.id

        next();

    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message });
    }

}
