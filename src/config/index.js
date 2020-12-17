const dotenv = require("dotenv");

const envFound = dotenv.config();
if (!envFound) {
  throw Error("Couln't find .env file!");
}

module.exports = {
  port: parseInt(process.env.PORT),
  dbUrl: process.env.DB_URL,

  jwtSecret: process.env.JWT_SECRET,
};
