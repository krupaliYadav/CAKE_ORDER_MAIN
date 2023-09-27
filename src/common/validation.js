const Joi = require("joi")

const registration = Joi.object().keys({
    firstName: Joi.string().required().messages({
        "string.empty": "The first name field is required.",
    }),
    lastName: Joi.string().required().messages({
        "string.empty": "The last name field is required.",
    }),
    email: Joi.string().required().messages({
        "string.empty": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    password: Joi.string().required().messages({
        "string.empty": "The password field is required.",
    }),
    phoneNumber: Joi.number().required().messages({
        "number.empty": "The phone number field is required.",
    }),
    lat: Joi.number().required().messages({
        "number.empty": "The latitude field is required.",
    }),
    long: Joi.number().required().messages({
        "number.empty": "The longitude field is required.",
    }),
    address: Joi.string().required().messages({
        "string.empty": "The address field is required.",
    }),
    deviceToken: Joi.string(),
    firebaseToken: Joi.string(),
})

const login = Joi.object().keys({
    email: Joi.string().required().messages({
        "string.empty": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    password: Joi.string().required().messages({
        "string.empty": "The password field is required.",
    }),
    deviceToken: Joi.string(),
    firebaseToken: Joi.string(),
})

const verifyOTP = Joi.object().keys({
    email: Joi.string().required().messages({
        "string.empty": "The email  is required.",
    }),
    OTP: Joi.string().required().messages({
        "string.empty": "The OTP  is required.",
    })
})

const resetPassword = Joi.object().keys({
    userId: Joi.string().required().messages({
        "string.empty": "UserId is required"
    }),
    password: Joi.string().required().messages({
        "string.empty": "The password field is required.",
    }),
})


const changePassword = Joi.object().keys({
    oldPassword: Joi.string().required().messages({
        "string.empty": "The old password field is required.",
    }),
    newPassword: Joi.string().required().messages({
        "string.empty": "The new password field is required.",
    })
})

const addAddress = Joi.object().keys({
    lat: Joi.number().required().messages({
        "number.empty": "The latitude field is required.",
    }),
    long: Joi.number().required().messages({
        "number.empty": "The longitude field is required.",
    }),
    address: Joi.string().required().messages({
        "string.empty": "The address field is required.",
    }),
})

const adminLogin = Joi.object().keys({
    email: Joi.string().required().messages({
        "string.empty": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    password: Joi.string().required().messages({
        "string.empty": "The password field is required.",
    }),
    deviceToken: Joi.string(),
    firebaseToken: Joi.string(),
})

const addUserValidation = [
    'firstName', 'lastName', 'email', "password", 'phoneNumber',
]

const addCakeValidation = [
    'name', 'price', 'description', 'categoryId', 'variant'
]

const placeOrderValidation = [
    'cakeId', 'variantId', 'addressId', 'orderType'
]

const addReviewValidation = Joi.object().keys({
    cakeId: Joi.string().required().messages({
        "string.empty": "cakeId is required"
    }),
    rating: Joi.number().required().messages({
        "number.empty": "The rating field is required.",
    }),
    review: Joi.string().required().messages({
        "string.empty": "The review field is required.",
    }),
})
module.exports = {
    registration,
    login,
    verifyOTP,
    resetPassword,
    changePassword,
    addAddress,
    adminLogin,
    addUserValidation,
    addCakeValidation,
    placeOrderValidation,
    addReviewValidation
}