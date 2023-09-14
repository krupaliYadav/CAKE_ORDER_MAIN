const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is Required"]
    },
    lastName: {
        type: String,
        required: [true, "Last name is Required"]
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
    image: {
        type: String,
    },
    isActive: {
        enum: [0, 1],
        type: Number,
        default: 1,
        comment: '0 = deactive, 1= active',
    },
    deviceToken: {
        type: String,
    },
    firebaseToken: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true }
)

module.exports = mongoose.model("User", userSchema);