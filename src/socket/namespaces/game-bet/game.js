const { BotPlayer } = require("./player")
const BOTS = require("./bots")

class Game {
    _state = "IDLE" // 'IDLE' || 'BETTING' || 'RESULT_CALCULATING' || 'PAY_MONEY'
    _players = {} // {_id: {user, prediction, betAmount}}
    _timer = 0
    _winners = []
    _losers = []
    _timerInterval = setInterval(() => {
        if (this._state === "PAY_MONEY" && this._timer === 3) {
            this._players = {}
            this._winners = []
            this._losers = []
            this._timer = 0
            this._state = "BETTING"
            this.createBots()
        }
        if (this._state === "BETTING" && this._timer === 3) {
            this._timer = 0
            this._state = "RESULT_CALCULATING"
        }
        if (this._state === "RESULT_CALCULATING" && this._timer === 3) {
            this._timer = 0
            this._state = "PAY_MONEY"
            this.payMoney()
        }
        this._timer++
        this._io.emit("tick", this._timer, this._state)
    }, 1000)

    constructor(io) {
        this._io = io
    }

    createBots() {
        BOTS.forEach(bot =>
            this.placeBet(
                bot,
                Math.floor(Math.random() * 10),
                this.calculateResult()
            )
        )
    }

    placeBet(user, betAmount, prediction) {
        if (this._state !== "BETTING") {
            console.log(`Cannot bet in ${this._state}`)
            return
        }
        this._players[user._id] = { ...user, betAmount, prediction }
    }

    calculateResult() {
        return Math.floor(Math.random() * 2)
    }

    payMoney() {
        const result = this.calculateResult()
        for (let playerId in this._players) {
            const { betAmount, prediction, username } = this._players[playerId]
            if (prediction !== result) {
                this._losers.push({ [username]: betAmount })
            } else this._winners.push({ [username]: betAmount })
        }
        this._io.emit("game-result", {
            winners: this._winners,
            losers: this._losers,
        })
        console.log(this._winners, this._losers)
    }

    start() {
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
