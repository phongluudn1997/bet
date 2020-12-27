const router = require("express").Router()
const { authController, playController } = require("../../constrollers")

router.get("/login", authController.renderPageLogin)
router.post("/login", authController.login)
router.get("/register", authController.renderPageRegister)
router.post("/register", authController.register)
router.get("/game", playController.renderPageGame)

module.exports = router
