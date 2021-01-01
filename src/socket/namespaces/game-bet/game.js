const User = require("../../../models/user")
const BOTS = require("./bots")

class Game {
    _result = 0 // 0 || 1
    _state = "IDLE" // 'IDLE' || 'BETTING' || 'RESULT_CALCULATING' || 'PAY_MONEY'
    _players = {} // {_id: {user, prediction, betAmount}}
    _timer = 0
    _winners = {}
    _losers = {}
    _timerInterval = setInterval(async () => {
        if (this._state === "PAY_MONEY" && this._timer === 1) {
            this._players = {}
            this._winners = {}
            this._losers = {}
            this._timer = 0
            this._state = "BETTING"
            this.createBots()
        }
        if (this._state === "BETTING" && this._timer === 1) {
            this._timer = 0
            this._state = "RESULT_CALCULATING"
            this._result = this.calculateResult()
        }
        if (this._state === "RESULT_CALCULATING" && this._timer === 1) {
            this._timer = 0
            this._state = "PAY_MONEY"
            await this.payMoney()
        }
        this._timer++
        this._io.emit("tick", this._timer, this._state)
    }, 1000)

    constructor(io) {
        this._io = io
    }

    async createBots() {
        const bots = await User.find({ role: "BOT" })
        bots.forEach(bot =>
            this.placeBet(
                bot,
                Math.floor(Math.random() * 10),
                this.calculateResult()
            )
        )
    }

    async placeBet(player, betAmount, prediction) {
        if (this._state !== "BETTING") {
            console.log(`Cannot bet in ${this._state}`)
            return
        }

        const { _id, username } = player

        const user = await User.findById(_id)

        if (user.coins < betAmount) {
            this._io.emit("payment-required", {
                message: `You cannot bet more than ${user.coins}`,
            })
            return
        }

        user.coins -= betAmount
        await user.save()

        this._players[_id] = {
            username,
            betAmount,
            prediction,
        }
    }

    calculateResult() {
        return Math.floor(Math.random() * 2)
    }

    async payMoney() {
        for (let playerId in this._players) {
            const { betAmount, prediction, username } = this._players[playerId]
            if (prediction !== this._result) {
                this._losers[playerId] = {
                    username,
                    betAmount,
                    prediction,
                }
            } else
                this._winners[playerId] = {
                    username,
                    betAmount,
                    prediction,
                }
        }
        await this.payForWinners()
        this._io.emit("game-result", {
            result: this._result,
            winners: this._winners,
            losers: this._losers,
        })
    }

    async payForWinners() {
        for (let winnerId in this._winners) {
            const user = await User.findById(winnerId)
            user.coins = user.coins + this._winners[winnerId].betAmount * 2
            await user.save()
        }
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
