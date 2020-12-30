const { Schema, model } = require("mongoose")

const UserSchema = new Schema(
    {
        username: { type: String, unique: true },
        password: { type: String },
        role: { type: String, enum: ["ADMIN", "USER", "BOT"], default: "USER" },
        email: { type: String },
    },
    {
        timestamps: true,
    }
)

const dataMigrate = [
    {
        username: "Bot1",
        role: "BOT",
    },
]

UserSchema.statics.getMigrateData = function () {
    return dataMigrate
}

module.exports = model("User", UserSchema, "users")
