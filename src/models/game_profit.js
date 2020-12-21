const mongoose = require("mongoose")
const Schema = mongoose.Schema

const _Schema = new Schema(
    {
        player: { type: Schema.Types.ObjectId, ref: "User", index: true },
        username: { type: String },
        bet: { type: Number },
        bonus: { type: Number, default: 0 },
        profit: { type: Number },
        total_profit: { type: Number },
    },
    {
        timestamps: true,
    }
)

/**
 * virtual
 */

/**
 * Method
 */

/**
 * Statics
 */

module.exports = mongoose.model("GameProfit", _Schema, "game-profit")
