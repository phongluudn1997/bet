class Player {
    constructor() {}
    async cancelBet() {}
}

class BotPlayer extends Player {
    constructor() {
        super()
    }
}

class UserPlayer extends Player {
    constructor(user) {
        super()
    }
}

module.exports = {
    Player,
    BotPlayer,
    UserPlayer,
}
