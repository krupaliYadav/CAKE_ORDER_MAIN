const Cake = require("../../models/cake")
const Category = require("../../models/category")
const Variant = require("../../models/variant")
const mongoose = require("mongoose")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const { HTTP_STATUS_CODE, PATH_END_POINT } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
const { addCakeValidation } = require("../../common/validation")
const { BadRequestException } = require("../../common/exceptions/index")

// add new user
const addCake = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { categoryId, variant } = fields
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
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'Category Type dose not exits..!' })
            }
            if (variant) {
                const variantObjects = variant.map(val => JSON.parse(val));
                for (const val of variantObjects) {
                    if (!mongoose.Types.ObjectId.isValid(val.variantId)) {
                        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "variant Id is not valid" });
                    } else {
                        const isVariantExists = await Variant.findOne({ _id: val.variantId });
                        if (!isVariantExists) {
                            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Cake variantId dose not exits" });
                        }
                    }
                }
                fields.variant = variantObjects
            }
            const newCake = new Cake(fields)
            if (files.image) {

                files.image = Array.isArray(files.image) ? files.image : [files.image];
                const imgData = await Promise.all(files.image?.map(async newImg => {
                    const imgName = newImg.originalFilename.split(".");
                    const extension = imgName[imgName.length - 1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed.` });
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
            }
            await newCake.save()
            return res.status(HTTP_STATUS_CODE.CREATED).json({ status: HTTP_STATUS_CODE.CREATED, success: true, message: "Cake added successfully" });
            // else {
            //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Cake image is required" });
            // }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

const getCake = async (req, res) => {
    const { cakeId, limit, offset, search } = req.query

    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let query = { isDeleted: 0 }
    if (cakeId) {
        if (!mongoose.Types.ObjectId.isValid(cakeId)) throw new BadRequestException("cake Id is not valid");
        query = { ...query, _id: new mongoose.Types.ObjectId(cakeId) }
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } },
            { "category.name": { $regex: search, $options: 'i' } },
        ];
    }
    let data = await Cake.aggregate([
        {
            $addFields: {
                price: {
                    $toString: "$price"
                }
            }
        },
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
        { $match: query },
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
                variantData: 1
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

    const totalCount = await Cake.countDocuments({ isDeleted: 0 })
    const filterCount = data.length;
    data = data.slice(offsetData, limitData + offsetData);

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake details load successfully", data: { totalCount, filterCount, data } });
}

const updateCake = async (req, res) => {
    let { cakeId } = req.params
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { categoryId, variant } = fields
            const cake = await Cake.findById(cakeId)

            // _ids validation
            if (categoryId) {
                if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please Enter Valid category Id" })
                }
                // check category exits or not
                const isCategoryExits = await Category.findOne({ _id: categoryId, isDeleted: 0, isActive: 1 })
                if (!isCategoryExits) {
                    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: 'Category Type dose not exits..!' })
                }
            }

            if (variant) {
                for (const val of variant) {
                    if (!mongoose.Types.ObjectId.isValid(val.variantId)) {
                        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "variant Id is not valid" });
                    } else {
                        const isVariantExists = await Variant.findOne({ _id: val.variantId, isDeleted: 0, isActive: 1 });
                        if (!isVariantExists) {
                            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Cake variantId dose not exits" });
                        }
                    }
                }
            }

            if (files.image) {
                files.image = Array.isArray(files.image) ? files.image : [files.image];
                const imgData = await Promise.all(files.image?.map(async newImg => {
                    const imgName = newImg.originalFilename.split(".");
                    const extension = imgName[imgName.length - 1];
                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed.` });
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

                cake.image.push(...imgData)
                await cake.save()
            }
            await Cake.findByIdAndUpdate({ _id: cakeId }, fields)
            return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake updated successfully" });
        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

const deleteSingleCakeImg = async (req, res) => {
    let { cakeId, imgPath } = req.body;
    imgPath = path.basename(imgPath)

    const cakeData = await Cake.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(cakeId) },
        { $pull: { image: imgPath } },
        { new: true }
    );
    if (!cakeData.image.includes(imgPath)) {
        const publicPathFileName = path.resolve(__dirname, "../../" + "/public/cake/")
        if (fs.existsSync(`${publicPathFileName}/${imgPath}`)) {
            // Delete the file from the upload folder
            fs.unlink(`${publicPathFileName}/${imgPath}`, (err) => {
                if (err) {
                    console.log('Error deleting file:', err);
                } else {
                    console.log("delete file form public folder successfully");
                }
            })
        }
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake image remove successfully" });
};

const deleteCake = async (req, res) => {
    const { cakeId } = req.params
    if (!mongoose.Types.ObjectId.isValid(cakeId)) throw new BadRequestException("Please enter valid cake Id")

    const data = await Cake.findByIdAndUpdate({ _id: cakeId }, { $set: { isDeleted: 1 } })
    if (!data) {
        throw new BadRequestException("Cake details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake delete successfully" });
}

// active de-active cake 
const cakeStatus = async (req, res) => {
    let { cakeId, status } = req.body

    if (!cakeId) {
        throw new BadRequestException("cakeId is required")
    }
    if (!mongoose.Types.ObjectId.isValid(cakeId)) {
        throw new BadRequestException("Please Enter Valid cake Id")
    }
    if (!status) {
        throw new BadRequestException("Status is required")
    }

    const cake = await Cake.findByIdAndUpdate({ _id: cakeId }, { $set: { isActive: status } })

    if (!cake) {
        throw new BadRequestException("Cake not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Cake status update successfully" });

}


module.exports = {
    addCake,
    getCake,
    deleteSingleCakeImg,
    updateCake,
    deleteCake,
    cakeStatus
}

