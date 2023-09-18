const User = require("../../models/userModel")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const { HTTP_STATUS_CODE, DEFAULT_PROFILE_IMG, PATH_END_POINT } = require("../../helper/constants.helper")
const { v4: uuidv4 } = require('uuid');
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

            const user = await User.findOne({ email: email, isDeleted: 0 })
            if (user) {
                throw new ConflictRequestException("An account already exists with this email address.")
            }

            const isPhoneNumber = await User.findOne({ phoneNumber: phoneNumber, isDeleted: 0 })
            if (isPhoneNumber) {
                throw new ConflictRequestException("This phone number already exists! Use a different phone number")
            }
            password = bcrypt.hashSync(password, 10)

            const newUser = new User({ firstName, lastName, email, password, phoneNumber })

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

// get all users
const getUserList = async (req, res) => {
    const data = await User.find({ isDeleted: 0 }).select('firstName lastName email phoneNumber image isActive')

    data.map((user) => {
        return user.image = `${PATH_END_POINT.userProfileImage}${user.image}`
    })
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User details load successfully", data });
}

const getSingleUser = async (req, res) => {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new BadRequestException("Please enter valid user Id")

    const data = await User.findOne({ _id: userId, isDeleted: 0 }).select('firstName lastName email phoneNumber image isActive')
    if (!data) {
        throw new BadRequestException("User details not found")
    } else {
        data.image = `${PATH_END_POINT.userProfileImage}${data.image}`
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User details load successfully", data });
    }
}

// update user profile
const updateUserProfile = async (req, res) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        try {
            let { email, phoneNumber, userId } = fields

            if (!userId) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "UserID is required" });
            }
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please enter valid user Id" });
            }
            const user = await User.findOne({ _id: userId, isDeleted: 0 })

            if (user) {

                // check email is exits or not
                if (email) {
                    const isEmailExists = await User.findOne({ email: email, isDeleted: 0 });
                    if (isEmailExists !== null && isEmailExists?._id.toString() !== userId) {
                        return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "Email is already exits" });
                    } else {
                        fields.email = email
                    }
                }
                // check phone number is exits or not
                if (phoneNumber) {
                    const isPhoneNumberExists = await User.findOne({ phoneNumber: phoneNumber, isDeleted: 0 });
                    if (isPhoneNumberExists !== null && isPhoneNumberExists?._id.toString() !== userId) {
                        return res.status(HTTP_STATUS_CODE.CONFLICT).json({ status: HTTP_STATUS_CODE.CONFLICT, success: false, message: "This phone number already exists! Use a different phone number" });
                    } else {
                        fields.phoneNumber = phoneNumber
                    }
                }

                // if profileImage
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

                    fields.image = fileName
                    fs.copyFile(files.image.filepath, newPath, async (err) => {
                        if (err) {
                            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
                        }

                        const publicPathFileName = path.resolve(__dirname, "../../" + "/public/profile/")

                        if (user.image !== DEFAULT_PROFILE_IMG.image) {
                            if (fs.existsSync(`${publicPathFileName}/${user.image}`)) {
                                // Delete the file from the upload folder
                                fs.unlink(`${publicPathFileName}/${user.image}`, (err) => {
                                    if (err) {
                                        console.log('Error deleting file:', err);
                                    } else {
                                        console.log("delete file form public folder successfully");
                                    }
                                })
                            }
                        }

                    });
                };
                await User.updateOne({ _id: userId }, fields)
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User profile update successfully" })
            } else {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "User not found" })
            }
        } catch (error) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message })
        }
    })
}

// delete user
const deleteUser = async (req, res) => {
    let { userId } = req.params
    if (!userId) {
        throw new BadRequestException("UserID is required")
    }

    const user = await User.findByIdAndUpdate({ _id: userId }, { $set: { isDeleted: 1 } })

    if (!user) {
        throw new BadRequestException("User not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User delete successfully" });
}

// active de-active user 
const userStatus = async (req, res) => {
    let { userId, status } = req.body

    if (!userId) {
        throw new BadRequestException("UserID is required")
    }
    if (!status) {
        throw new BadRequestException("Status is required")
    }

    const user = await User.findByIdAndUpdate({ _id: userId }, { $set: { isActive: status } })

    if (!user) {
        throw new BadRequestException("User not found")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "User status update successfully" });

}

module.exports = {
    addUser,
    getUserList,
    getSingleUser,
    updateUserProfile,
    deleteUser,
    userStatus
}