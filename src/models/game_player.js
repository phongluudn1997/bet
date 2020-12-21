const mongoose = require("mongoose")
const Schema = mongoose.Schema

const GamePlayerSchema = new Schema(
    {
        game: { type: Schema.Types.ObjectId, ref: "Game" },
        player: { type: Schema.Types.ObjectId, ref: "User", index: true },
        bot: { type: Schema.Types.ObjectId, ref: "Bot", index: true },
        bet: { type: Number },
        auto_cash_out: { type: Number },
        cashed_out: { type: Number },
        bonus: { type: Number, default: 0 },
        profit: { type: Number },
        player_gross_profit: { type: Number, default: 0 },
        player_net_profit: { type: Number, default: 0 },
        is_bot: { type: Boolean, default: false }, //
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("GamePlayer", GamePlayerSchema, "game-players")
