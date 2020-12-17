const { CustomError } = require("../common/errors")

const handleError = (err, req, res, next) => {
  console.log(err)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      errors: err.serializeErrors(),
    })
  }
  return res.status(500).json({
    errors: [
      {
        message: err.message,
      },
    ],
  })
}

module.exports = handleError
