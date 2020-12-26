const { BotPlayer } = require("./player")

class Game {
    _state = "IDLE" // 'IDLE' || 'BETTING' || 'RESULT_CALCULATING' || 'PAY_MONEY'
    _players = {} // {_id: {user, prediction, betAmount}}
    _timer = 0
    _winners = []
    _losers = []
    _paid = false
    _timerInterval = setInterval(() => {
        if (this._state === "PAY_MONEY" && this._timer === 5) {
            this._timer = 0
            this._paid = false
            this._state = "BETTING"
        }
        if (this._state === "BETTING" && this._timer === 15) {
            this._timer = 0
            this._state = "RESULT_CALCULATING"
        }
        if (this._state === "RESULT_CALCULATING" && this._timer === 10) {
            this._timer = 0
            this._state = "PAY_MONEY"
            !this._paid && this.payMoney()
        }
        this._timer++
        this._io.emit("tick", this._timer, this._state)
    }, 1000)

    constructor(io) {
        this._io = io
    }

    createBots(number) {
        for (let i = 0; i < number; i++) {
            this._players.push(new BotPlayer())
        }
    }

    placeBet(user, betAmount, prediction) {
        if (this._state !== "BETTING") {
            console.log(`Cannot bet in ${this._state}`)
            return
        }
        this._players[user._id] = { ...user, betAmount, prediction }
        console.log(this._players)
    }

    calculateResult() {
        const result = Math.floor(Math.random() * 2)
        return result
    }

    payMoney() {
        const result = this.calculateResult()
        for (let playerId in this._players) {
            const { betAmount, prediction } = this._players[playerId]
            if (prediction !== result) {
                this._losers.push({ [playerId]: betAmount })
            } else this._winners.push({ [playerId]: betAmount })
        }
        this.paid = true
        console.log(this._winners, this._losers)
    }

    start() {
        // this.createBots(30)
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
