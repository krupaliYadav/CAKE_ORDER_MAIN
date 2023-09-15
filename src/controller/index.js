//user
module.exports.userAuthController = require("./user/auth");
module.exports.userProfileController = require("./user/userProfileController");

// admin
module.exports.adminAuthController = require("./admin/adminAuth");
module.exports.userAController = require("./admin/userAController");
module.exports.optionsAController = require("./admin/optionsAController");