const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const GeneralError = require("./general-error")

class NotFoundException extends GeneralError {
    constructor(message) {
        super();
        this.message = message || "Error: Not Found";
        this.statusCode = HTTP_STATUS_CODE.NOT_FOUND;
    }
}

module.exports = NotFoundException;