const PlayerManager = require("./player")

class GameManager {
    _state = "ENDED"
    _playerManager
    constructor() {
        this.playerManager = new PlayerManager()
    }
}

export default GameManager
