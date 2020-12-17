const CustomError = require("./custom.error")

class BadRequestError extends CustomError {
  statusCode = 400
  constructor(message = "Bad request") {
    super(message)
  }
  serializeErrors() {
    return [
      {
        message: this.message,
      },
    ]
  }
}

module.exports = BadRequestError
