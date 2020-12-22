const http = require("./app")
const mongoose = require("mongoose")
const config = require("./config")
const DATABASE_URL = config.DATABASE.DATABASE_URL
const PORT = config.PORT

;(() => {
    mongoose.connect(DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    const db = mongoose.connection
    db.on("error", console.error.bind(console, "Connection error:"))
    db.once("open", () => {
        console.log("Database connected successfully!")
    })
})()

http.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`)
})
