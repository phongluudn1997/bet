const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")

const socket = require("./socket")
const { handleError } = require("./middlewares")
const router = require("./routes")

const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)

socket(io)

app.set("views", "src/views")
app.set("view engine", "pug")

app.use(cors())

app.use(
  bodyParser.json({
    limit: "50mb",
  })
)
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
)

app.use("/", router)

app.use(handleError)

module.exports = http
