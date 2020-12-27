const userModel = require("../../models/user")
const UserService = require("../../services/user.service")
const { asyncHandler } = require("../../middlewares")

const renderPageLogin = (req, res) => {
    return res.render("login", {})
}

const login = asyncHandler(async (req, res, next) => {
    const userServiceInstance = new UserService(userModel)
    const { user, token } = await userServiceInstance.login(req.body)
    req.session.userAuth = user
    req.session.token = token
    res.redirect("/game")

    // res.json({
    //     message: "Login successfully!",
    //     data: { token },
    // })
})

const renderPageRegister = (req, res) => {
    return res.render("register", {})
}

const register = asyncHandler(async (req, res) => {
    const userServiceInstance = new UserService(userModel)
    const newUser = await userServiceInstance.register(req.body)
    res.json({ user: newUser })
})

module.exports = {
    renderPageLogin,
    login,
    renderPageRegister,
    register,
}
