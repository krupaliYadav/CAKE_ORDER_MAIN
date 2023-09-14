const GeneralError = require("../exceptions/general-error")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper");

module.exports = (err, req, res, next) => {
    console.log(err);
    if (err && err.error && err.error.isJoi) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            success: false,
            message: err.error.message,
        });

    }

    if (err instanceof GeneralError) {
        return res.status(err.statusCode).json({ status: err.statusCode, success: false, message: err.message });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ status: err.statusCode, success: false, message: err.message });
    } else {
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
    }
};