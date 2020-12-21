const { testChat } = require("./namespaces")

const _socket = io => {
  testChat(io.of("/test-chat"))

  // Main socket app
  // gameChat(io.of("/game-chat"))
  // gameBet(io.of("/game-bet"))
}

module.exports = _socket
