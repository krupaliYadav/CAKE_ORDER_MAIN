require("dotenv").config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const path = require("path")
const connectDatabase = require("./src/config/dbConnection")
const routes = require("./src/routes/index")
const errorHandlerMiddleware = require("./src/common/middleware/error-handler.middleware");
const bodyParser = require('body-parser');
const morgan = require('morgan')

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'))
app.use(express.json());
app.use("/api/v1", routes)
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));

app.get('/', (req, res) => res.send('Hello World!'))
app.use(errorHandlerMiddleware);

app.listen(port, async () => {
    await connectDatabase()
    console.log(`Server is running on ${port}`);
})