const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is Required"]
    },
    image: {
        type: String
    },
    isActive: {
        enum: [0, 1],
        type: Number,
        default: 1,
        comment: '0 = deactive, 1= active',
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true })

module.exports = mongoose.model("Category", categorySchema);