//user
module.exports.userAuthController = require("./user/auth");
module.exports.userProfileController = require("./user/userProfileController");
module.exports.cakeUController = require("./user/cakeUController")
module.exports.orderUController = require("./user/orderUController")
module.exports.sliderUController = require("./user/sliderUController")
module.exports.notificationUController = require("./user/notification")


// admin
module.exports.adminAuthController = require("./admin/adminAuth");
module.exports.userAController = require("./admin/userAController");
module.exports.optionsAController = require("./admin/optionsAController");
module.exports.cakeAController = require("./admin/cakeAController");
module.exports.orderAController = require("./admin/orderAController")
module.exports.dashBoardAController = require("./admin/dashBoard")
module.exports.sliderAController = require("./admin/sliderController")
module.exports.notificationAController = require("./admin/adminNotification")
