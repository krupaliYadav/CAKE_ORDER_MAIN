const routes = require("express").Router()
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { adminLogin } = require("../common/validation")
const { isAuthenticatedAdmin } = require("../common/middleware/authenticate.middleware")
const { adminAuthController, userAController, optionsAController } = require("../controller/index")


routes
    // authentication
    .post("/login", validator.body(adminLogin), expressAsyncHandler(adminAuthController.login))

    // User
    .post("/addUser", isAuthenticatedAdmin, expressAsyncHandler(userAController.addUser))
    .get("/getUserList", isAuthenticatedAdmin, expressAsyncHandler(userAController.getUserList))
    .put("/updateUserProfile", isAuthenticatedAdmin, expressAsyncHandler(userAController.updateUserProfile))
    .delete("/deleteUser/:userId", isAuthenticatedAdmin, expressAsyncHandler(userAController.deleteUser))
    .post("/userStatus", isAuthenticatedAdmin, expressAsyncHandler(userAController.userStatus))

    // category
    .post("/addCategory", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.addCategory))

module.exports = routes