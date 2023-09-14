const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is Required"]
    },
    email: {
        type: String,
        required: [true, "Email  is Required"]
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

module.exports = mongoose.model("Admin", adminSchema);