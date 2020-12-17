const express = require("express");
const app = express();

app.set("views", "src/views");
app.set("view engine", "pug");

app.get("/", function (req, res) {
  res.render("index", { title: "Hey", message: "Hello there!" });
});

module.exports = app;
