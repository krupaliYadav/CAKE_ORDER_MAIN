const { createValidator } = require("express-joi-validation");

const validator = createValidator({
    passError: true,
});

module.exports = validator;