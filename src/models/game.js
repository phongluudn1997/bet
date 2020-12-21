const mongoose = require("mongoose")
const Schema = mongoose.Schema

const GameSchema = new Schema(
    {
        crash_at: { type: Number, default: 0 },
        bet: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        profit: { type: Number, default: 0 },
        profit_fees_pool: { type: Number, required: true, default: 0 },
        profit_discharge_pool: { type: Number, required: true, default: 0 },
        algorithm: { type: String, required: true, default: "" },
        pools: {
            type: Object,
            required: true,
            default: { discharge_pool: 0, fees_pool: 0 },
        },
        previousHash: { type: String },
        hash: { type: String },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Game", GameSchema, "game")
