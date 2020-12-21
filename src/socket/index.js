const { testChat, gameBet } = require("./namespaces")

const _socket = io => {
    testChat(io.of("/test-chat"))
    gameBet(io.of("/game-bet"))
}

module.exports = _socket
