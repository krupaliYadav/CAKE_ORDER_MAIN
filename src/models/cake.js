const mongoose = require("mongoose");

const cakeSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Cake name is Required"]
    },
    price: {
        type: Number
    },
    description: {
        type: String,
        required: [true, "Description  is Required"]
    },
    categoryId: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
    },
    image: {
        type: [String],
    },
    variant: [{
        variantId: {
            type: mongoose.Schema.ObjectId,
            ref: "Variant",
            required: [true, "VariantId is Required"]
        },
        variantPrice: {
            type: Number,
            required: [true, "Price is Required"]
        }
    }],
    isPopular: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = NonPopular, 1= popular',
    },
    isCustom: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = NonCustom, 1= custom',
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
    },
    rating: {
        type: Number,
        default: 0,
    },
    noOfReviews: { type: Number }
}, { timestamps: true })

module.exports = mongoose.model("Cake", cakeSchema);