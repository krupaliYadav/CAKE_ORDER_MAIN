const FCM = require('fcm-node');
const serverKey = process.env.FCM_SERVER_KEY;
const fcm = new FCM(serverKey);
const { HTTP_STATUS_CODE } = require("../helper/constants.helper")
const Notification = require("../models/notification")

async function fcmNotification({ message, deviceIds }) {
    return new Promise((resolve, reject) => {
        const messageBody = {
            registration_ids: deviceIds,
            notification: {
                title: message.title,
                body: message.message,
            },
            data: {
                content: message.content
            },
        };

        fcm.send(messageBody, (err, response) => {
            if (err) {
                console.log('err: ', err);
                resolve(null);
            } else {
                console.log('Successfully sent with response: ', response);
                resolve(response);
            }
        });
    });
}

async function inAppNotification({ userId, orderId, title, message, adminId }) {
    try {
        await Notification.create({ userId, orderId, title, message, adminId })
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message });
    }
}

module.exports = {
    fcmNotification,
    inAppNotification
};