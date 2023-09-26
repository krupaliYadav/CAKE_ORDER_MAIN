const Notification = require("../../models/notification")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")

const getNotification = async (req, res) => {
    let userId = req.user
    const data = await Notification.find({ userId: userId, isDeleted: 0 }).select('title message createdAt')
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Notification details load successfully", data: data });
}

module.exports = {
    getNotification
}
