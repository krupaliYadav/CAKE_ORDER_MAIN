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
    password: {
        type: String,
        required: [true, "Password  is Required"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number  is Required"]
    },
    address: {
        type: String,
        required: [true, "address is required"]
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true })

module.exports = mongoose.model("Admin", notificationSchema);