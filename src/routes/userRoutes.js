const routes = require("express").Router()
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { registration, login, verifyOTP, resetPassword, changePassword, addAddress } = require("../common/validation")
const { isAuthenticatedUser } = require("../common/middleware/authenticate.middleware")
const { userAuthController, userProfileController } = require("../controller/index")


routes
    // authentication
    .post("/register", validator.body(registration), expressAsyncHandler(userAuthController.register))
    .post("/login", validator.body(login), expressAsyncHandler(userAuthController.login))
    .post("/forgotPassword", expressAsyncHandler(userAuthController.forgotPassword))
    .post("/verifyOTP", validator.body(verifyOTP), expressAsyncHandler(userAuthController.verifyOTP))
    .post("/resetPassword", validator.body(resetPassword), expressAsyncHandler(userAuthController.resetPassword))
    .post("/changePassword", isAuthenticatedUser, validator.body(changePassword), expressAsyncHandler(userAuthController.changePassword))
    .post("/logOut", isAuthenticatedUser, expressAsyncHandler(userAuthController.handleLogOut))

    // userProfile
    .get("/getUser", isAuthenticatedUser, expressAsyncHandler(userProfileController.getProfile))
    .put("/updateProfile", isAuthenticatedUser, expressAsyncHandler(userProfileController.updateUserProfile))
    .post("/addAddress", isAuthenticatedUser, validator.body(addAddress), expressAsyncHandler(userProfileController.addAddress))
    .get("/getAllAddressList", isAuthenticatedUser, expressAsyncHandler(userProfileController.getAllAddressList))
    .put("/updateAddress/:addressId", isAuthenticatedUser, expressAsyncHandler(userProfileController.updateAddress))
    .delete("/deleteAddress/:addressId", isAuthenticatedUser, expressAsyncHandler(userProfileController.deleteAddress))


module.exports = routes