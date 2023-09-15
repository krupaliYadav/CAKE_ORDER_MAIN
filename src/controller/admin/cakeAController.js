const Cake = require("../../models/cake")
const Category = require("../../models/category")
const mongoose = require("mongoose")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
const { addCakeValidation } = require("../../common/validation")
const { BadRequestException, ConflictRequestException, NotFoundRequestException } = require("../../common/exceptions/index")

// add new user
const addCake = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { name, price, description, categoryId, variant } = fields
            // validation
            const validation = addCakeValidation.filter(field => !fields[field]);
            if (validation.length > 0) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: `${validation.join(', ')} is required` })
            }

            // _ids validation
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please Enter Valid category Id" })
            }
            // check category exits or not
            const isCategoryExits = await Category.findOne({ _id: categoryId, isDeleted: 0, isActive: 1 })
            if (!isCategoryExits) {
                return res.status(HttpStatus.BAD_REQUEST).json({ status: HttpStatus.BAD_REQUEST, success: false, message: 'Category Type dose not exits..!' })
            }

            const newCake = new Cake({ name, price, description, categoryId, variant })

            if (files.image) {

                files.image = Array.isArray(files.image) ? files.image : [files.image];
                const imgData = await Promise.all(files.image?.map(async newImg => {
                    const imgName = newImg.originalFilename.split(".");
                    const extension = imgName[imgName.length - 1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HttpStatus.ERROR).json({ status: HttpStatus.ERROR, success: false, message: req.t("ImageExtension", { extension: extension }) });
                    }
                    const fileName = uuidv4() + "." + extension;
                    const newPath = path.resolve(__dirname, "../../" + `/public/cake/${fileName}`);
                    fs.copyFile(newImg.filepath, newPath, async (err) => {
                        if (err) {
                            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                        }
                    });
                    return fileName
                }));

                newCake.image = [...imgData]
                await newCake.save()
                return res.status(HTTP_STATUS_CODE.CREATED).json({ status: HTTP_STATUS_CODE.CREATED, success: true, message: "Cake added successfully" });
            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Cake image is required" });
            }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

module.exports = {
    addCake
}

