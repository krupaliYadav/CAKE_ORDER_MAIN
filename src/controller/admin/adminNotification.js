const Notification = require("../../models/notification")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")

const getAdminNotification = async (req, res) => {
    let adminId = req.admin
    const data = await Notification.find({ adminId: adminId, isDeleted: 0 }).select('title message createdAt userId orderId')
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Notification details load successfully", data: data });
}

module.exports = {
    getAdminNotification
}
