const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "Cake",
        required: [true, "CakeId is Required"]
    },
    cakeId: {
        type: mongoose.Schema.ObjectId,
        ref: "Cake",
        required: [true, "CakeId is Required"]
    },
    variant: {
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variant'
        },
        variantName: {
            type: String
        },
        variantPrice: {
            type: String
        },
    },
    orderId: {
        type: String,
        unique: true,
        require: [true, "orderId is required."]
    },
    addressId: {
        type: mongoose.Schema.ObjectId,
        ref: "Address",
        required: [true, "addressId is Required"]
    },
    isCustom: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = NonCustom, 1= custom',
    },
    nameOnCake: {
        type: String
    },
    orderType: {
        enum: [1, 2],
        type: Number,
        comment: '1 = schedule, 2 = instant',
        required: [true, "order type is Required"]
    },
    image: {
        type: [String]
    },
    dateTime: {
        type: Date
    },
    altPhoneNumber: {
        type: String
    },
    note: {
        type: String
    },
    status: {
        enum: [0, 1, 2, 3, 4],
        type: Number,
        default: 0,
        comment: '0 = pending, 1 = accepted, 2 = cancelled, 3 = inProgress, 4 = completed',
    },
    isReviewed: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema);