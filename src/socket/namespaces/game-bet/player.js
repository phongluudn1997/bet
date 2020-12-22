const { GameManager } = require("./game")

class Player {
    _gameManager
    constructor() {
        this._gameManager = new GameManager()
    }
    async placeBet() {}
}

module.exports = Player
