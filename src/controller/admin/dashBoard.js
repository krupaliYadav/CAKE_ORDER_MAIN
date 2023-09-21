const User = require("../../models/userModel")
const Cake = require("../../models/cake")
const Category = require("../../models/category")
const Order = require("../../models/order")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")

const dashBoardCount = async (req, res) => {
    let query = { isDeleted: 0 }

    const totalUserCount = await User.countDocuments(query)
    const totalCategoryCount = await Category.countDocuments(query)
    const totalCakeCount = await Cake.countDocuments(query)
    const totalOrderCount = await Order.countDocuments(query)
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Details load successfully", data: { totalUserCount, totalCategoryCount, totalCakeCount, totalCategoryCount, totalOrderCount } });
}

module.exports = {
    dashBoardCount
}