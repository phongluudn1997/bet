const { Schema, model } = require("mongoose")

const UserSchema = new Schema(
    {
        username: { type: String, unique: true },
        password: { type: String },
        role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
        email: { type: String },
        wallet_address: { required: true, type: String, default: "pending" },
        wallet_address_eth: {
            required: true,
            type: String,
            default: "pending",
        },
        wallet_address_trx: {
            required: true,
            type: Object,
            default: "pending",
        },
        finances: {
            deposit_data: { type: Array, default: [] },
            deposits: { type: Number, default: 0 },
            withdrawals: { type: Number, default: 0 },
            free_coin: { type: Number, default: 0 },
            net_profit: { type: Number, default: 0 },
            gross_profit: { type: Number, default: 0 },
            commissions: { type: Number, default: 0 },
        },
        resetPasswordToken: { type: String, required: false },
        resetPasswordExpires: { type: Date, required: false },
        games: {
            games_played: { type: Number, default: 0 },
        },
        status: { type: String, enum: ["pending", "confirmed"] },
        blocked: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
)
module.exports = model("User", UserSchema, "users")
