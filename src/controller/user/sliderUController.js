const Slider = require("../../models/slider")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")

const getAllSliders = async (req, res) => {
    const { limit, offset } = req.query
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;
    let data = await Slider.find({ isDeleted: 0, isActive: 1 }).select("image isActive")
    if (data.length) {
        data.map((item) => {
            item.image = PATH_END_POINT.sliderImg + item.image
            return item;
        });
    }
    const totalCount = data.length
    data = data.slice(offsetData, limitData + offsetData);
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Slider list load successfully", data: { totalCount, data } });
}


module.exports = {
    getAllSliders,
}