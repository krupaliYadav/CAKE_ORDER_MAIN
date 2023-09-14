const mongoose = require("mongoose");

const connectDatabase = async () => {
    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => {
        console.log("Backend is Connected")
    }).catch((Error) => {
        console.log("Error =>", Error);
    })
};

module.exports = connectDatabase;