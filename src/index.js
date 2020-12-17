const app = require("./app");
const mongoose = require("mongoose");
const config = require("./config");
const DB_URL = config.dbUrl;

(() => {
  mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "Connection error:"));
  db.once("open", () => {
    console.log("Database connected successfully!");
  });
})();

const port = config.port || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
