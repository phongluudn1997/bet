const dotenv = require("dotenv")
const envFound = dotenv.config()
if (!envFound) {
    throw Error("Couln't find .env file!")
}
const __DEV__ = require("./env/development")
const __PRO__ = require("./env/production")
const __STG__ = require("./env/staging")

const defaults = {
    GAME_FEES: 0,
    DATABASE: {
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_URL: process.env.DATABASE_URL,
    },
    GAME_NAME: process.env.GAME_NAME || "Lucky Number",
    GAME_CURRENCY: {
        CRYPTO_CURRENCY_NAME: process.env.CRYPTO_CURRENCY_NAME || "Ethereum",
        CRYPTO_CURRENCY: process.env.CRYPTO_CURRENCY || "ETH",
        COIN_CURRENCY: process.env.COIN_CURRENCY || "Ethos",
    },
    SECRET: {
        JWT_SECRET: process.env.JWT_SECRET || "JWT_SECRET",
    },
}

const config = {
    development: {
        ...defaults,
        ...__DEV__,
    },
    production: {
        ...defaults,
        ...__PRO__,
    },
    staging: {
        ...defaults,
        ...__STG__,
    },
}

module.exports = config[process.env.NODE_ENV || "development"]
