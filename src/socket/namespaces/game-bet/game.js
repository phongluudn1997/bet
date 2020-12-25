const { BotPlayer } = require("./player")

class Game {
    _state = "IDLE" // 'IDLE' || 'BETTING' || 'RESULT_CALCULATING' || 'PAY_MONEY'
    _players = []
    _timer = 0
    _timerInterval = setInterval(() => {
        if (this._state === "BETTING" && this._timer === 15) {
            this._timer = 0
            this._state = "RESULT_CALCULATING"
        }
        if (this._state === "RESULT_CALCULATING" && this._timer === 10) {
            this._timer = 0
            this._state = "PAY_MONEY"
        }
        if (this._state === "PAY_MONEY" && this._timer === 5) {
            this._timer = 0
            this._state = "BETTING"
        }
        this._timer++
        this._io.emit("tick", this._timer, this._state)
    }, 1000)

    constructor(io) {
        this._io = io
    }
    createBots(number) {
        for (let i = 0; i < number; i++) {
            this._players.push(new BotPlayer(this))
        }
    }
    placeBet(user, amount, prediction) {
        if (this._state !== "BETTING") {
            console.log(`Cannot bet in ${this._state}`)
        }
    }

    calculateResult() {
        const result = Math.floor(Math.random() * 2)
        return result
    }

    payMoney() {
        const result = this.calculateResult()
        this._players.forEach(player => {
            if (player.prediction === result) {
                io.emit("")
            }
        })
    }

    start() {
        this.createBots(30)
        console.log(this._players)
        this._state = "BETTING"
        this._timerInterval
    }

    stop() {
        clearInterval(this._timerInterval)
        this._state = "IDLE"
    }

    pause() {}
    resume() {}
}

module.exports = Game
