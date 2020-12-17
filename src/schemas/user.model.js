const { Schema, model } = require("mongoose")

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    salt: String,
  },
  {
    timestamps: true,
  }
)

module.exports = model("User", UserSchema, "users")
