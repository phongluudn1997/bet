const { BadRequestError } = require("../common/errors")
const express = require("express")
const router = express.Router()

const userRouter = require("./user")
const clientRouter = require("./client")

router.get("/", function (req, res) {
    res.render("index", { title: "Hey", message: "Hello there!" })
})

router.use("/", clientRouter)

router.use("/user", userRouter)

router.get("/error", (req, res) => {
    throw new BadRequestError("Pass anything")
})

module.exports = router
