class CustomError extends Error {
  statusCode
  constructor(message) {
    super(message)
  }
  serializeErrors() {}
}

module.exports = CustomError
