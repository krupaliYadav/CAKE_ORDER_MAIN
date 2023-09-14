const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "UserId is Required"]
    },
    lat: {
        type: String,
        required: [true, "lat is required"]
    },
    long: {
        type: String,
        required: [true, "long is required"]
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
}, {
    timestamps: true
})
module.exports = mongoose.model("Address", addressSchema);
