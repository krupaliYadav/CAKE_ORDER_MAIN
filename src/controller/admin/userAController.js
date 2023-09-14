const User = require("../../models/userModel")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const formidable = require("formidable")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const { addUserValidation } = require("../../common/validation")
const { BadRequestException, ConflictRequestException, NotFoundRequestException } = require("../../common/exceptions/index")

// add new user
const addUser = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { firstName, lastName, email, password, phoneNumber } = fields

            // validation
            const validation = addUserValidation.filter(field => !fields[field]);
            if (validation.length > 0) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: `${validation.join(', ')} is required` })
            }

            const user = await User.findOne({ email: email })
            if (user) {
                throw new ConflictRequestException("An account already exists with this email address.")
            }

            const isPhoneNumber = await User.findOne({ phoneNumber: phoneNumber })
            if (isPhoneNumber) {
                throw new ConflictRequestException("This phone number already exists! Use a different phone number")
            }
            password = bcrypt.hashSync(password, 10)

            const newUser = await User.create({ firstName, lastName, email, password, phoneNumber })

            if (files.image) {
                const { mimetype } = files.image;
                const img = mimetype.split("/");
                const extension = img[1].toLowerCase();

                if (extension !== "jpeg" && extension !== "png" && extension !== "jpg") {
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: `${extension} is not allowed..` });
                };

                const fileName = (files.image.originalFilename =
                    uuidv4() + "." + extension);
                const newPath = path.resolve(__dirname, "../../" + `/public/profile/${fileName}`);

                newUser.image = fileName
                await newUser.save()

                fs.copyFile(files.image.filepath, newPath, async (err) => {
                    if (err) {
                        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                    }
                });
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User added successfully" });

            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Profile image is required" });
            }

        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

module.exports = {
    addUser
}