const routes = require("express").Router()
const userRoutes = require("./userRoutes")
const adminRoutes = require("./adminRoutes")

routes
    .use("/admin", adminRoutes)
    .use("/users", userRoutes)

module.exports = routes