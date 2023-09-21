const FCM = require('fcm-node');
const serverKey = process.env.FCM_SERVER_KEY;
const fcm = new FCM(serverKey);

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


module.exports = { fcmNotification };