const mongoose = require("mongoose")
const Schema = mongoose.Schema

const { ENGLISH_NAMES } = require("../utils/constant")

const BotSchema = new Schema(
    {
        username: { type: String, unique: true, index: true },
        finances: {
            free_coin: { type: Number, default: 0 },
            net_profit: { type: Number, default: 0 },
            gross_profit: { type: Number, default: 0 },
        },
        type_bot: {
            type: String,
            enum: ["REAL_BOT", "VIR_BOT_A", "VIR_BOT_B"],
            required: true,
        },
        games: {
            games_played: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
    }
)

const VIR_BOTS_A = Array(ENGLISH_NAMES.length)
    .fill(null)
    .map((bot, index) => ({
        username: ENGLISH_NAMES[index],
        finances: {
            net_profit: 0,
            gross_profit: 0,
        },
        type_bot: "VIR_BOT_A",
    }))

const dataMigrate = [...VIR_BOTS_A]

BotSchema.statics.getMigrateData = function () {
    return dataMigrate
}

module.exports = mongoose.model("Bot", BotSchema, "bots")