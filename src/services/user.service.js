const { BadRequestError } = require("../common/errors")
const { randomBytes } = require("crypto")
const bcrypt = require("bcrypt")

const { SECRET } = require("../config")
const { JWT_SECRET } = SECRET
const jwt = require("jsonwebtoken")

const SALT = 10

class UserService {
    userModel
    constructor(userModel) {
        this.userModel = userModel
    }

    async register(userRegisterDTO) {
        const { email, password, nickname } = userRegisterDTO
        const existedUser = await this.userModel.findOne({ email }).exec()
        if (existedUser) {
            throw new BadRequestError("Email registered!")
        }

        const salt = randomBytes(32)
        const hashedPassword = await bcrypt.hash(password, SALT)
        let user = await this.userModel.create({
            email,
            salt: salt.toString("hex"),
            password: hashedPassword,
            nickname,
        })

        return user
    }

    async login(userLoginDTO) {
        const { email, password } = userLoginDTO

        const user = await this.userModel.findOne({ email }).exec()
        if (!user) {
            throw new BadRequestError("The email hasn't been registered!")
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            throw new BadRequestError("Wrong password!")
        }

        const token = this.generateToken(user.toJSON())

        return { user, token }
    }

    generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET)
    }
}

module.exports = UserService
