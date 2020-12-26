class Player {
    constructor(user) {
        this.user = user
    }
    async cancelBet() {}
}

class BotPlayer extends Player {
    constructor(user) {
        super(user)
    }
}

class UserPlayer extends Player {
    constructor(user) {
        super(user)
    }
}

module.exports = {
    Player,
    BotPlayer,
    UserPlayer,
}
