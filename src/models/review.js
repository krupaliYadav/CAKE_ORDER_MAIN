const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        require: [true, "userId is Required"]
    },
    cakeId: {
        type: mongoose.Schema.ObjectId,
        ref: "Cake",
        require: [true, "cakeId is Required"]
    },
    rating: {
        type: Number,
        require: [true, "Rating is required"]
    },
    review: {
        type: String,
        require: [true, "Review is required"]
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
        comment: '0 = notDeleted, 1= deleted'
    }
}, { timestamps: true })

reviewSchema.post('save', async function (doc) {
    const Cake = mongoose.model('Cake');

    const ratings = await this.model('Review').find({ cakeId: doc.cakeId });
    const filteredReviews = ratings.filter(rating => rating.review !== undefined);
    const averageRating = ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length;
    const cake = await Cake.findById(doc.cakeId);
    cake.rating = averageRating.toFixed(2);
    cake.noOfReviews = filteredReviews.length;
    await cake.save();
});

module.exports = mongoose.model("Review", reviewSchema);