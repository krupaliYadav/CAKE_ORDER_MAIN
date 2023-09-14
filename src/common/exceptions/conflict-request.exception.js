const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")
const GeneralError = require("./general-error")

class ConflictRequestException extends GeneralError {
    constructor(message) {
        super();
        this.message = message || "Conflict request!";
        this.statusCode = HTTP_STATUS_CODE.CONFLICT;

    }
}

module.exports = ConflictRequestException;