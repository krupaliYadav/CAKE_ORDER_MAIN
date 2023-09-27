const Cake = require("../../models/cake")
const Category = require("../../models/category")
const Review = require("../../models/review")
const Order = require("../../models/order")
const mongoose = require("mongoose")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")
const { BadRequestException, ConflictRequestException, NotFoundRequestException } = require("../../common/exceptions/index")

const getCakeList = async (req, res) => {
    const { cakeId, limit, offset, categoryId, isPopular, isCustom } = req.query

    let query = { isDeleted: 0, isActive: 1 }
    if (cakeId) {
        if (!mongoose.Types.ObjectId.isValid(cakeId)) throw new BadRequestException("cake Id is not valid");
        query = { ...query, _id: new mongoose.Types.ObjectId(cakeId) }
    }

    if (categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) throw new BadRequestException("category Id is not valid");
        const isCategoryExits = await Category.findOne({ _id: categoryId, isDeleted: 0, isActive: 1 })
        if (!isCategoryExits) {
            throw new BadRequestException('Category Type dose not exits..!')
        }
        query = { ...query, categoryId: new mongoose.Types.ObjectId(categoryId) }
    }

    if (isPopular) {
        query = { ...query, isPopular: 1 }
    }

    if (isCustom) {
        query = { ...query, isCustom: 1 }
    }

    let data = await Cake.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: "_id",
                as: 'category',
                pipeline: [
                    { $project: { name: 1, isActive: 1, _id: 0 } }
                ]
            }
        },
        { $unwind: "$category" },
        {
            $lookup: {
                from: 'variants',
                localField: 'variant.variantId',
                foreignField: "_id",
                as: 'variantData',
                pipeline: [
                    { $project: { name: 1, isActive: 1 } },

                ],
            }
        },
        {
            $project: {
                _id: 1,
                category: 1,
                name: 1,
                price: 1,
                description: 1,
                image: 1,
                isPopular: 1,
                isCustom: 1,
                isActive: 1,
                variant: 1,
                variantData: 1,
                noOfReviews: { $ifNull: ["$noOfReviews", null] },
                rating: { $ifNull: ["$rating", null] }
            }
        }
    ]);

    if (data.length) {
        data.map((item) => {
            item.image = item.image.map((imageName) => PATH_END_POINT.cakeImage + imageName);
            return item;
        });

        data.forEach((val) => {
            val.variant.forEach((ele) => {
                val.variantData.forEach((temp) => {
                    if (temp._id.toString() === ele.variantId.toString()) {
                        ele.variantName = temp.name
                        ele.isActive = temp.isActive
                        delete ele._id
                    }
                })
            })
            delete val.variantData
        })
    }

    const count = data.length;
    const limitData = parseInt(limit, 10) || count;
    const offsetData = parseInt(offset, 10) || 0;
    data = data.slice(offsetData, limitData + offsetData);

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake details load successfully", data: { count, data } });
}


const addRatingAndReview = async (req, res) => {
    const userId = req.user
    const { cakeId, rating, review } = req.body;
    if (!mongoose.Types.ObjectId.isValid(cakeId)) throw new BadRequestException("Please enter valid cake id")

    const isCake = await Cake.findOne({ _id: cakeId });
    if (isCake) {
        await Review.create({
            userId: userId,
            cakeId: cakeId,
            rating: rating,
            review: review
        });
        // update review status in order table
        await Order.updateMany({ userId: userId, cakeId: cakeId }, { $set: { isReviewed: true } })
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Save successfully" });
    } else {
        throw new BadRequestException("Cake details not found");
    }
}

module.exports = {
    getCakeList,
    addRatingAndReview
}

