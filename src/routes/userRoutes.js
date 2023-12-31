const routes = require("express").Router()
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { registration, login, verifyOTP, resetPassword, changePassword, addAddress, addReviewValidation } = require("../common/validation")
const { isAuthenticatedUser } = require("../common/middleware/authenticate.middleware")
const { userAuthController, userProfileController, optionsAController, cakeUController, orderUController, sliderUController, notificationUController } = require("../controller/index")


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
    .put("/updateProfile", isAuthenticatedUser, expressAsyncHandler(userProfileController.updateProfile))
    .post("/addAddress", isAuthenticatedUser, validator.body(addAddress), expressAsyncHandler(userProfileController.addAddress))
    .get("/getAllAddressList", isAuthenticatedUser, expressAsyncHandler(userProfileController.getAllAddressList))
    .put("/updateAddress/:addressId", isAuthenticatedUser, expressAsyncHandler(userProfileController.updateAddress))
    .delete("/deleteAddress/:addressId", isAuthenticatedUser, expressAsyncHandler(userProfileController.deleteAddress))

    // category
    .get("/getCategory", expressAsyncHandler(optionsAController.getAllCategoryList))

    // cake
    .get("/getCakeList", expressAsyncHandler(cakeUController.getCakeList))

    // cake review
    .post("/addRatingAndReview", isAuthenticatedUser, validator.body(addReviewValidation), expressAsyncHandler(cakeUController.addRatingAndReview))

    // order
    .post("/placeOrder", isAuthenticatedUser, expressAsyncHandler(orderUController.placeOrder))
    .get("/getMyOrders", isAuthenticatedUser, expressAsyncHandler(orderUController.getMyAllOrders))

    // sliders
    .get("/getAllSliders", expressAsyncHandler(sliderUController.getAllSliders))

    // notification
    .get("/getNotification", isAuthenticatedUser, expressAsyncHandler(notificationUController.getNotification))



module.exports = routes