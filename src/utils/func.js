const jwt = require("jsonwebtoken")
const config = require("../config")

const jwtToken = (data = {}) => {
    try {
        return jwt.sign(data, config.jwtSecret)
    } catch {
        return null
    }
}

const pareJwtToken = token => {
    try {
        return jwt.verify(token, config.SECRET.JWT_SECRET)
    } catch {
        return null
    }
}

const randInt = (start, stop) => {
    return Math.floor(Math.random() * (stop - start + 1) + start)
}

const randFloat = (start, stop, fixed = 2) => {
    return parseFloat(
        (Math.random() * (stop - start + 1) + start).toFixed(fixed)
    )
}

function randString(isToken = false, len = 10) {
    var text = ""
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    var n = len
    if (isToken) {
        n = 40
        possible = "abcdefghijklmnopqrstuvwxyz0123456789-"
    }
    for (var i = 0; i < n; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
}

const toJsonObject = (data = [], key) => {
    if (key) {
        return data.reduce((cur, next) => ({ ...cur, [next[key]]: next }), {})
    }
    return data
}

module.exports = {
    jwtToken,
    randInt,
    randFloat,
    randString,
    pareJwtToken,
    toJsonObject,
}
