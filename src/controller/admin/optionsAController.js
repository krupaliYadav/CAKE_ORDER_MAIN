const Category = require("../../models/category")
const Cake = require("../../models/cake")
const User = require("../../models/userModel")
const Variant = require("../../models/variant")
const Notification = require("../../models/notification")
const formidable = require("formidable")
const { HTTP_STATUS_CODE, PATH_END_POINT, notificationMSGs } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const { BadRequestException, ConflictRequestException } = require("../../common/exceptions/index")
const { fcmNotification } = require("../../helper/fcmNotification.helper")

// add new category
const addCategory = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { name } = fields
            if (!name) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Category name is required" });
            }
            const category = await Category.findOne({ name: name, isDeleted: 0 })
            if (category) {
                return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "Category name is already exits" });
            }

            const newCategory = new Category({ name })

            if (files.image) {
                const { mimetype } = files.image;
                const img = mimetype.split("/");
                const extension = img[1].toLowerCase();

                if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed..` });
                };

                const fileName = (files.image.originalFilename =
                    uuidv4() + "." + extension);
                const newPath = path.resolve(__dirname, "../../" + `/public/category/${fileName}`);

                newCategory.image = fileName
                await newCategory.save()

                fs.copyFile(files.image.filepath, newPath, async (err) => {
                    if (err) {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                    }
                });

                // push notification
                const deviceIds = [];
                const data = []
                const users = await User.find({ isDeleted: 0, isActive: 1 })
                users.map((user) => {
                    if (user.deviceToken !== null) {
                        if (user.firebaseToken !== null) {
                            deviceIds.push(user.firebaseToken);
                        }
                    }
                    if (deviceIds.length > 0) {
                        let message = notificationMSGs.newCategoryAdded(name)
                        fcmNotification({ message: message, deviceIds });
                        let setData = {
                            userId: user._id,
                            title: message.title,
                            message: message.message
                        }
                        data.push(setData)
                    }
                })
                await Notification.insertMany(data)
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category added successfully" });

            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Category image is required" });
            }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

// get all category
const getAllCategoryList = async (req, res) => {
    const path = req.baseUrl
    let { limit, offset, search } = req.query
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let totalCount;
    let data = []
    let query = { isDeleted: 0 }
    if (search) {
        query.name = { $regex: search, $options: 'i' }
    }

    if (path.includes("users")) {
        query = { ...query, isActive: 1 }
        data = await Category.find(query).select('name image isActive')
        totalCount = await Category.countDocuments({ isDeleted: 0, isActive: 1 })
    } else {
        data = await Category.find(query).select('name image isActive')
        totalCount = await Category.countDocuments({ isDeleted: 0 })
    }
    data.map((category) => {
        return category.image = `${PATH_END_POINT.categoryImage}${category.image}`
    })

    const filterCount = data.length;
    data = data.slice(offsetData, limitData + offsetData);
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category list load successfully", data: { totalCount, filterCount, data } })
}

// get single category
const getCategoryDetails = async (req, res) => {
    const { categoryId } = req.params
    if (!mongoose.Types.ObjectId.isValid(categoryId)) throw new BadRequestException("Please enter valid category Id")

    const data = await Category.findOne({ _id: categoryId, isDeleted: 0 }).select('name image isActive')
    if (!data) {
        throw new BadRequestException("Category details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category details load successfully", data });

}

// update category
const updateCategory = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { categoryId, name } = fields

            if (!categoryId) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "CategoryId is required" });
            }
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please enter valid category Id" });

            }
            const category = await Category.findOne({ _id: categoryId, isDeleted: 0 })

            if (category) {

                // check category is exits or not
                if (name) {
                    const isCategoryExists = await Category.findOne({ name: name, isDeleted: 0 });
                    if (isCategoryExists !== null && isCategoryExists?._id.toString() !== categoryId) {
                        return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "Category name is already exits" });
                    } else {
                        fields.name = name
                    }
                }


                // if image
                if (files.image) {
                    const { mimetype } = files.image;
                    const img = mimetype.split("/");
                    const extension = img[1].toLowerCase();

                    if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed..` });
                    };

                    const fileName = (files.image.originalFilename =
                        uuidv4() + "." + extension);
                    const newPath = path.resolve(__dirname, "../../" + `/public/category/${fileName}`);

                    fields.image = fileName
                    fs.copyFile(files.image.filepath, newPath, async (err) => {
                        if (err) {
                            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                        }

                        const publicPathFileName = path.resolve(__dirname, "../../" + "/public/category/")

                        if (fs.existsSync(`${publicPathFileName}/${category.image}`)) {
                            // Delete the file from the upload folder
                            fs.unlink(`${publicPathFileName}/${category.image}`, (err) => {
                                if (err) {
                                    console.log('Error deleting file:', err);
                                } else {
                                    console.log("delete file form public folder successfully");
                                }
                            })
                        }
                    });
                };
                await Category.updateOne({ _id: categoryId }, fields)
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category update successfully" })
            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Category not found" })
            }
        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

// delete category
const deleteCategory = async (req, res) => {
    const { categoryId } = req.params
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException("Please enter valid category Id");
    }
    const category = await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { isDeleted: 1 } })

    if (!category) {
        throw new BadRequestException("Category not found")
    }

    const filter = { categoryId: categoryId };
    const update = { $set: { isDeleted: 1 } };
    await Cake.updateMany(filter, update);

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category delete successfully" });
}

// active de-active category 
const categoryStatus = async (req, res) => {
    let { categoryId, status } = req.body

    if (!categoryId) {
        throw new BadRequestException("categoryId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException("Please Enter Valid category Id")
    }
    if (!status) {
        throw new BadRequestException("Status is required")
    }

    const category = await Category.findByIdAndUpdate({ _id: categoryId }, { $set: { isActive: status } })

    if (!category) {
        throw new BadRequestException("Category not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category status update successfully" });

}

// add new variant
const addVariant = async (req, res) => {
    let { name } = req.body
    if (!name) throw new BadRequestException("Variant name is required")
    const variant = await Variant.findOne({ name: name, isDeleted: 0 })
    if (variant) throw new ConflictRequestException("Variant name is already exits")

    await Variant.create({ name })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant add successfully" })
}

// get all variant
const getAllVariantList = async (req, res) => {
    let { limit, offset, search } = req.query
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let query = { isDeleted: 0 }
    if (search) {
        query.name = { $regex: search, $options: 'i' }
    }

    let data = await Variant.find(query).select('name  isActive')

    let totalCount = await Variant.countDocuments({ isDeleted: 0 })
    let filterCount = data.length
    data = data.slice(offsetData, limitData + offsetData);

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant list load successfully", data: { totalCount, filterCount, data } })
}

// get single variant
const getVariantDetails = async (req, res) => {
    const { variantId } = req.params
    if (!mongoose.Types.ObjectId.isValid(variantId)) throw new BadRequestException("Please enter valid variant Id")

    const data = await Variant.findOne({ _id: variantId, isDeleted: 0 }).select('name  isActive')
    if (!data) {
        throw new BadRequestException("Variant details not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant details load successfully", data });

}

//update variant
const updateVariant = async (req, res) => {
    const { variantId, name } = req.body
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
        throw new BadRequestException("Please enter valid variant Id");
    }
    if (!name) throw new BadRequestException("Variant name is required")

    const isVariantExits = await Variant.findOne({ name: name, isDeleted: 0 })
    if (isVariantExits !== null && isVariantExits?._id.toString() !== variantId) throw new ConflictRequestException("Variant name is already exits")

    const variant = await Variant.findByIdAndUpdate({ _id: variantId }, { $set: { name: name } })
    if (!variant) {
        throw new BadRequestException("Variant not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant update successfully" });
}

//delete variant
const deleteVariant = async (req, res) => {
    const { variantId } = req.params
    if (!mongoose.Types.ObjectId.isValid(variantId)) throw new BadRequestException("Please enter valid variant Id");

    const variant = await Variant.findByIdAndUpdate({ _id: variantId }, { $set: { isDeleted: 1 } })

    if (!variant) {
        throw new BadRequestException("Variant not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant delete successfully" });
}

// active de-active variant 
const variantStatus = async (req, res) => {
    let { variantId, status } = req.body

    if (!variantId) throw new BadRequestException("variantId is required")
    if (!mongoose.Types.ObjectId.isValid(variantId)) throw new BadRequestException("Please Enter Valid variant Id")
    if (!status) throw new BadRequestException("Status is required")

    const variant = await Variant.findByIdAndUpdate({ _id: variantId }, { $set: { isActive: status } })
    if (!variant) throw new BadRequestException("Variant not found")

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Variant status update successfully" });
}

module.exports = {
    // category
    addCategory,
    getAllCategoryList,
    getCategoryDetails,
    updateCategory,
    deleteCategory,
    categoryStatus,
    // variant
    addVariant,
    getAllVariantList,
    getVariantDetails,
    updateVariant,
    deleteVariant,
    variantStatus
}
