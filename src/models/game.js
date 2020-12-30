const mongoose = require("mongoose")
const Schema = mongoose.Schema

const GameSchema = new Schema(
    {
        result: {
            type: Number,
            enum: [0, 1],
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Game", GameSchema, "game")
