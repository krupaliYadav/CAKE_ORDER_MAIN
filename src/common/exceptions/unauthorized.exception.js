const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const GeneralError = require("./general-error")

class UnauthorizedException extends GeneralError {
    constructor(message) {
        super();
        this.message = message || "Unauthenticated.";
        this.statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
    }
}

module.exports = UnauthorizedException;