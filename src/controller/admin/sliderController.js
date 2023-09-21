const Slider = require("../../models/slider")
const mongoose = require("mongoose")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
const { BadRequestException } = require("../../common/exceptions/index")

// add new slider
const addSlider = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            if (files.image) {
                const { mimetype } = files.image;
                const img = mimetype.split("/");
                const extension = img[1].toLowerCase();

                if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed..` });
                };

                const fileName = uuidv4() + "." + extension
                const newPath = path.resolve(__dirname, "../../" + `/public/sliderImg/${fileName}`);

                fs.copyFile(files.image.filepath, newPath, async (err) => {
                    if (err) {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                    }
                });
                await Slider.create({ image: fileName })
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Slider added successfully" });
            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Image is required" });
            }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

const getSliders = async (req, res) => {
    const { limit, offset } = req.query
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;
    let data = await Slider.find({ isDeleted: 0 }).select("image isActive")
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

const getSingleSlider = async (req, res) => {
    const { sliderId } = req.params

    let data = await Slider.findOne({ _id: sliderId, isDeleted: 0 }).select("image isActive")
    if (!data) {
        throw new BadRequestException("Slider details not found")
    } else {
        data.image = `${PATH_END_POINT.sliderImg}${data.image}`
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Slider details load successfully", data });
    }

}

const deleteSlider = async (req, res) => {
    const { sliderId } = req.params
    if (!mongoose.Types.ObjectId.isValid(sliderId)) throw new BadRequestException("Please enter valid slider Id")

    const data = await Slider.findByIdAndUpdate({ _id: sliderId }, { $set: { isDeleted: 1 } })
    if (!data) {
        throw new BadRequestException("Slider Image not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Slider image delete successfully" });
}

// active de-active slider 
const sliderStatus = async (req, res) => {
    let { sliderId, status } = req.body

    if (!sliderId) throw new BadRequestException("sliderId is required")
    if (!mongoose.Types.ObjectId.isValid(sliderId)) throw new BadRequestException("Please Enter Valid slider Id")
    if (!status) throw new BadRequestException("Status is required")

    const slider = await Slider.findByIdAndUpdate({ _id: sliderId }, { $set: { isActive: status } })
    if (!slider) {
        throw new BadRequestException("slider not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Slider status update successfully" });

}



module.exports = {
    addSlider,
    getSliders,
    getSingleSlider,
    deleteSlider,
    sliderStatus,
}