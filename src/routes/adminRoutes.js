const routes = require("express").Router()
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { adminLogin } = require("../common/validation")
const { isAuthenticatedAdmin } = require("../common/middleware/authenticate.middleware")
const { adminAuthController, userAController } = require("../controller/index")


routes
    // authentication
    .post("/login", validator.body(adminLogin), expressAsyncHandler(adminAuthController.login))

    // User
    .post("/addUser", isAuthenticatedAdmin, expressAsyncHandler(userAController.addUser))

module.exports = routes