class Player {
    constructor({ game, user }) {
        this.game = game
    }
    async cancelBet() {}
}

class BotPlayer extends Player {
    constructor(game) {
        super(game)
    }
}

class UserPlayer extends Player {
    constructor(game, user) {
        super(game)
        this.user = user
    }
}

module.exports = {
    Player,
    BotPlayer,
    UserPlayer,
}
