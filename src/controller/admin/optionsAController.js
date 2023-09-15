const Category = require("../../models/category")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const { addUserValidation } = require("../../common/validation")
const { BadRequestException, ConflictRequestException, NotFoundRequestException } = require("../../common/exceptions/index")

// add new address
const addCategory = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { name } = fields
            if (!name) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Category name is required" });
            }
            const category = await Category.findOne({ name: name })
            if (category) {
                throw new ConflictRequestException("Category name is already exits")
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
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Category added successfully" });

            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Category image is required" });
            }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

module.exports = {
    addCategory
}
