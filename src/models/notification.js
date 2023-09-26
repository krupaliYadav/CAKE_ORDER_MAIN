const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "userId is Required"]
    },
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
    },
    title: {
        type: String,
        required: [true, "Title  is Required"]
    },
    message: {
        type: String,
        required: [true, "Message is Required"]
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true })

module.exports = mongoose.model("Notification", notificationSchema);