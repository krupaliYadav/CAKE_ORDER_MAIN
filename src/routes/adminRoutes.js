const routes = require("express").Router()
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { adminLogin } = require("../common/validation")
const { isAuthenticatedAdmin } = require("../common/middleware/authenticate.middleware")
const { adminAuthController, userAController, optionsAController, cakeAController, orderAController, dashBoardAController } = require("../controller/index")


routes
    // authentication
    .post("/login", validator.body(adminLogin), expressAsyncHandler(adminAuthController.login))

    // User
    .post("/addUser", isAuthenticatedAdmin, expressAsyncHandler(userAController.addUser))
    .get("/getUserList", isAuthenticatedAdmin, expressAsyncHandler(userAController.getUserList))
    .get("/getSingleUser/:userId", isAuthenticatedAdmin, expressAsyncHandler(userAController.getSingleUser))
    .post("/updateUserProfile", isAuthenticatedAdmin, expressAsyncHandler(userAController.updateUserProfile))
    .post("/deleteUser/:userId", isAuthenticatedAdmin, expressAsyncHandler(userAController.deleteUser))
    .post("/userStatus", isAuthenticatedAdmin, expressAsyncHandler(userAController.userStatus))

    // category
    .post("/addCategory", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.addCategory))
    .get("/getCategory", expressAsyncHandler(optionsAController.getAllCategoryList))
    .get("/getCategoryDetails/:categoryId", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.getCategoryDetails))
    .post("/updateCategory", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.updateCategory))
    .post("/deleteCategory/:categoryId", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.deleteCategory))
    .post("/categoryStatus", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.categoryStatus))

    // variant
    .post("/addVariant", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.addVariant))
    .get("/getVariant", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.getAllVariantList))
    .get("/getVariantDetails/:variantId", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.getVariantDetails))
    .post("/updateVariant", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.updateVariant))
    .post("/deleteVariant/:variantId", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.deleteVariant))
    .post("/variantStatus", isAuthenticatedAdmin, expressAsyncHandler(optionsAController.variantStatus))

    // cake
    .post("/addCake", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.addCake))
    .get("/getCake", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.getCake))
    .post("/updateCake/:cakeId", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.updateCake))
    .post("/deleteSingleImg", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.deleteSingleCakeImg))
    .post("/deleteCake/:cakeId", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.deleteCake))
    .post("/cakeStatus", isAuthenticatedAdmin, expressAsyncHandler(cakeAController.cakeStatus))

    // order
    .get("/getOrderList", isAuthenticatedAdmin, expressAsyncHandler(orderAController.getOrderList))
    .post("/changeOrderStatus", isAuthenticatedAdmin, expressAsyncHandler(orderAController.changeOrderStatus))

    // dashboard
    .get("/dashBoardCount", isAuthenticatedAdmin, expressAsyncHandler(dashBoardAController.dashBoardCount))

module.exports = routes