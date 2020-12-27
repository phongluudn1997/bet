const { BadRequestError } = require("../common/errors")
const express = require("express")
const router = express.Router()

const userRouter = require("./user")
const clientRouter = require("./client")

router.get("/", (req, res) => res.render("index", { aaa: "Hello World" }))

router.use("/", clientRouter)

router.use("/user", userRouter)

router.get("/error", (req, res) => {
    throw new BadRequestError("Pass anything")
})

module.exports = router
