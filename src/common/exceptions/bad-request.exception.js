const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const GeneralError = require("./general-error")

class BadRequestException extends GeneralError {
    constructor(message = "Bad Request!") {
        super();
        this.message = message;
        this.statusCode = HTTP_STATUS_CODE.BAD_REQUEST;
    }
}

module.exports = BadRequestException;