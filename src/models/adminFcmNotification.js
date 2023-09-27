const mongoose = require("mongoose");

const adminFcmNotificationSchema = mongoose.Schema({
    adminId: {
        type: mongoose.Schema.ObjectId,
        ref: "Admin",
    },
    deviceToken: {
        type: String
    },
    firebaseToken: {
        type: String
    },
}, { timestamps: true });

module.exports = mongoose.model("AdminFcmNotification", adminFcmNotificationSchema);