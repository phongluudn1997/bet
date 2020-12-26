const router = require("express").Router()
const { authController } = require("../../constrollers")

router.get("/login", authController.renderPageLogin)
router.post("/login", authController.login)
router.get("/register", authController.renderPageRegister)
router.post("/register", authController.register)

module.exports = router
