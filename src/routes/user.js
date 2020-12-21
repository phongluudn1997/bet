const express = require("express")
const router = express.Router()

const userModel = require("../models/user")
const UserService = require("../services/user.service")
const { asyncHandler } = require("../middlewares")

router.post(
    "/register",
    asyncHandler(async (req, res) => {
        const userServiceInstance = new UserService(userModel)
        const newUser = await userServiceInstance.register(req.body)
        res.json({ user: newUser })
    })
)

router.post(
    "/login",
    asyncHandler(async (req, res, next) => {
        const userServiceInstance = new UserService(userModel)
        const token = await userServiceInstance.login(req.body)
        res.json({
            message: "Login successfully!",
            data: { token },
        })
    })
)

module.exports = router
