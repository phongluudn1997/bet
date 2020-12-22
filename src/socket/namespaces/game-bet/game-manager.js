const RESTART_TIME = 15000 // How long from  game_starting -> game_started
const TICK_RATE = 150 // ping the client every X miliseconds
const AFTER_CRASH_TIME = 3000 // how long from game_crash -> game_starting

const TOP3_ALGORITHMS = [
    "BALACE_ALGORITHM",
    "SUCTION_ALGORITHM",
    "DISCHARGE_ALGORITHM",
]

const Game = require("../../../models/game")
const Coefficient = require("../../../models/coefficient")
const GamePlayer = require("../../../models/game_player")
const User = require("../../../models/user")
const Setting = require("../../../models/setting")
const SHA256 = require("crypto-js/sha256")
const lib = require("../../../utils/lib")

const { toJsonObject, randInt } = require("../../../utils/func")

const {
    growthFunc,
    getProfitPoolInc,
    getDischargePoolInc,
    formatPlayersAtClientSide,
    isBot,
} = require("./game-utils")

const config = require("../../../config")

// services
const { ProfitService } = require("../../../services")

let bots_top_to_down_number = 5

/**
 * Functions calculation for profit
 */

class GameManager {
    constructor(io, playersManager) {
        let self = this
        self.autogame = true
        self.coefficient = 0
        self.position = 0
        self.state = "ENDED" // 'STARTING' | 'BLOCKING' | 'IN_PROGRESS' |  'ENDED'

        self.game = null
        self.maxWin = 0
        self.bankroll = 0
        self.controllerIsRunning = false // if we are running games. there can still be a game in progress
        self.startTime // time game started. If before game started, is an estimate...
        self.crashPoint // when the game crashes, 0 means instant crash
        self.gameDuration // how long till the game will crash..

        self.openBet = 0 // how much satoshis is still in action
        self.totalWon = 0 // how much satoshis players won (profit)

        self.hash = null

        // Timer to schedule the next regular tick
        self.tickTimer = null

        self.max_bet_profit = {
            max_bet: 0,
            max_profit: 0,
        }

        // Comon algorithms
        self.algorithms = {
            is_admin_crash: false,
            is_admin_coefficient: false,
            looper_crash_all: {
                // arr: [1, 5, 19],
                // points: [102],
                current: 0,
            },
            shark_algorithm: {
                // average_total_bet: 1200,
                // time_rate: 5, // if current total bet >= average_total_bet * time_rate -> kill shark
                // crash_at: 102
            },
            gamming_calculation: {
                total_bet: 0,
                total_given: 0,
                fees_taken: 0,
                excess_cash: 0,
                extra_amount: 0,
            },
            game_info: {
                // This config setup again when game start
                discharge_coins: 0,
                fee_taken: 3,
                suction_ratio: 0,
            },
            pools: {
                // discharge_pool: 0,
                // profit_pool: 0,
                // discharge_wallet: 0,
            },
            bots_config: {
                // VIR_BOT_A: {
                //     num_bot_play: 12,
                //     auto_cash_out: [101, 500],
                //     bet: [10, 80],
                // },
                top_to_down_number: 5,
                looper_bots: [],
                current_looper: 0,
            },
            applied_algorithm: null,
        }

        // Algorithm V2
        self.algorithms_v2 = {
            balance_algorithm: {
                // ratio: 0.03
            },

            suction_algorithm: {
                // ratio: 0.4,
                // fees: 0.03
            },

            discharge_algorithm: {
                // minimum_amount: 2000,
                // ratio_random: 0.7,
                // ratio_maximum: 0.33
            },
        }
        // Algorithm V3
        self.algorithms_v3 = {
            is_actived: false,
        }

        const getAverageHistories = (limit = 5) =>
            new Promise((rs, rj) => {
                Game.find()
                    .sort([["createdAt", -1]])
                    .limit(limit)
                    .exec((er, games) => {
                        if (er || games == null) rj("Game not found")
                        else {
                            rs(
                                parseInt(
                                    games.reduce(
                                        (cur, next) => cur + next.bet,
                                        0
                                    ) / games.length
                                )
                            )
                        }
                    })
            })

        const autoBetBots = (cur = 0, bots = []) => {
            if (bots[cur] && self.state == "STARTING") {
                io.emit("bet", {
                    game: bots[cur].game,
                    player_id: bots[cur].user._id,
                    user: {
                        username: bots[cur].user.username,
                    },
                    status: "PLAYING",
                })

                setTimeout(() => {
                    autoBetBots(cur + 1, bots)
                }, randInt(10, 300))
            }
        }

        const runGame = async () => {
            // console.log('aaa ', self);
            self.state = "STARTING"
            self.game = new Game()
            if (self.algorithms.is_admin_coefficient) {
                const _coefficient = await Setting.findOne({
                    name: "coefficient",
                })
                self.coefficient = _coefficient.value
                self.algorithms.is_admin_coefficient = !self.algorithms
                    .is_admin_coefficient
            }
            try {
                playersManager.players = {}
                await getSetting()
                await playersManager.createBots(
                    self.algorithms.bots_config,
                    self.game,
                    bots => {
                        if (bots.length > 0) {
                            setTimeout(() => {
                                autoBetBots(0, bots)
                            }, 500)
                        }
                    }
                )
            } catch (er) {
                setTimeout(startGame, 1000)
            }

            self.openBet = 0
            self.totalWon = 0
            self.startTime = new Date(Date.now() + RESTART_TIME)
            self.maxWin = Math.round(self.bankroll * 0.03) // Risk 3% per game
            io.emit("game_starting", {
                game_id: self.game._id,
                max_win: self.maxWin,
                max_bet_profit: self.max_bet_profit,
                time_till_start: RESTART_TIME,
            })

            setTimeout(blockGame, RESTART_TIME)
        }

        const blockGame = () => {
            self.state = "BLOCKING" // we're waiting for pending bets..
            const loop = () => {
                if (playersManager.pendingCount > 0) {
                    // 'Delaying game by 100ms for ', playersManager.pendingCount, ' joins'
                    return setTimeout(loop, 100)
                }

                if (
                    Object.keys(playersManager.players) == 0 ||
                    self.controllerIsRunning == false
                ) {
                    return setTimeout(runGame, 100)
                }
                startGame()
            }

            loop()
        }

        const startGame = async () => {
            const bets = playersManager.getPlayersBetted()
            const real_users = playersManager.getRealPlayers()
            self.state = "IN_PROGRESS"
            // TODO: write detail about this so far
            io.emit("real_users", {
                real_users: real_users,
            })

            io.emit("bets", {
                bets: bets,
            })

            // we think that setForcePoint function is not safely
            try {
                self.startTime = new Date()
                playersManager.pendingCount = 0

                io.emit("game_started", {
                    bets: bets,
                })

                scheduleNextTick(0)
            } catch (er) {
                console.log("ERR", er)
                blockGame()
            }
        }

        const scheduleNextTick = elapsed => {
            self.tickTimer && clearTimeout(self.tickTimer)
            self.tickTimer = setTimeout(self.runTick, TICK_RATE)
        }

        const scheduleNextGame = async crashTime => {
            if (self.controllerIsRunning)
                setTimeout(runGame, crashTime + AFTER_CRASH_TIME - Date.now())
            else console.log("Game paused")
        }

        const endGame_v2 = () => {
            const algorithm = self.algorithms.applied_algorithm
            const game_info = self.algorithms.game_info
            const crash_time = Date.now()
            const crash_at = self.forcePoint
            const total_bet = playersManager.getTotalBet()
            const { discharge_coins, fee_taken } = game_info

            const total_won = playersManager.totalWon()
            const toal_bonus = playersManager.totalBonus()
            const excess_cash =
                total_bet + discharge_coins - (total_won + toal_bonus)
            const profit_pool_inc = getProfitPoolInc(
                algorithm,
                game_info,
                excess_cash
            )
            const discharge_pool_inc = getDischargePoolInc(
                algorithm,
                game_info,
                excess_cash
            )
            const real_users = playersManager.getRealPlayers()
            io.emit("real_users", {
                real_users: real_users,
            })

            self.game.set({
                ...self.game,
                bet: total_bet,
                profit: profit_pool_inc + discharge_pool_inc,
                profit_fees_pool: profit_pool_inc,
                profit_discharge_pool: discharge_pool_inc,
                crash_at,
                bonus: toal_bonus,
                gamming_calculation: {
                    game_info,
                    total_won,
                    toal_bonus,
                    excess_cash,
                },
                hash: SHA256(
                    JSON.stringify(playersManager.players) + new Date()
                ).toString(),
            })

            io.emit("game_crash", {
                forced: crash_at,
                players: formatPlayersAtClientSide(playersManager.players),
                history: {
                    _id: self.game._id,
                    bet: self.game.bet,
                    profit: self.game.profit,
                    crash_at: self.game.crash_at,
                    hash: self.game.hash,
                },
            })

            Promise.all([
                // in the futuer, winners and losers can be real bots
                playersManager.payForWinners(total_won + toal_bonus),
                playersManager.deductFromLosers(),
                ProfitService.updatePools({
                    profit_pool_inc,
                    discharge_pool_inc,
                }),
                saveGame(),
                playersManager.saveGamePlayers(),
                playersManager.saveGameProfits(),
            ])
                .then(async ([winners, losers, pools, game, game_layers]) => {
                    await self.setupCoefficient()
                    self.setupNextLooperBots()
                    self.setupNextLooperCrash()

                    self.algorithms.applied_algorithm = null
                    self.forcePoint = null
                    self.algorithms.is_admin_crash = false

                    self.ramdomMax = [
                        100,
                        156,
                        115,
                        132,
                        101,
                        121,
                        110,
                        195,
                        183,
                        161,
                    ][Math.floor(Math.random() * 10)]
                    console.log(self.ramdomMax)
                    //tringuyen
                    console.log("------End game OK-----")
                    // console.log(algorithm);
                    scheduleNextGame(crash_time)
                })
                .catch(err => {
                    console.log("------End game ERROR-----")
                    console.log(err)
                    scheduleNextGame(crash_time)
                })
        }

        const saveGame = () => {
            // TODO
            return self.game.save()
        }

        self.adminCrashGame = () => {
            if (self.state === "IN_PROGRESS") {
                self.algorithms.is_admin_crash = true
                self.setForcePoint()
            } else {
                io.emit("ADMIN", "Game in progress!")
            }
        }

        self.adminCoefficientGame = () => {
            if (self.state === "IN_PROGRESS") {
                self.algorithms.is_admin_coefficient = true
            } else {
                io.emit("ADMIN", "Game in progress!")
            }
        }

        self.runTick = () => {
            let elapsed = new Date() - self.startTime
            let at = growthFunc(elapsed)

            self.runCashOuts(at)

            if (self.forcePoint <= at) {
                // oh no, we crashed
                self.cashOutAll(self.forcePoint)
                endGame_v2()
            } else {
                // The game must go on.
                // Throw the cashouts at the client ..
                io.emit("tick", elapsed)

                scheduleNextTick(elapsed)
            }
        }

        self.cashOut = (user, callback) => {
            if (self.state !== "IN_PROGRESS")
                return callback("GAME_NOT_IN_PROGRESS")

            let elapsed = new Date() - self.startTime
            let at = growthFunc(elapsed)
            let player = lib.getOwnProperty(
                playersManager.players,
                user.username
            )

            if (!player) return callback("NO_BET_PLACED")

            if (player.auto_cash_out <= at) at = player.auto_cash_out

            // This is not entirely correct. Auto cashouts should be run first which
            // potentially change the forcepoint and then this check should occur. If
            // this condition is true it should also cashOutAll other players.
            // if (self.forcePoint <= at)
            //     at = self.forcePoint;
            if (at > self.forcePoint) return callback("GAME_ALREADY_CRASHED")

            if (player.status === "CASHED_OUT")
                return callback("ALREADY_CASHED_OUT")

            // At this point we accepted the cashout and will report it as a tick to the
            // clients. Therefore abort the scheduled tick. Take extra care about this
            // before adding any IO to this function as it might allow ticks in between
            // or delay ticks until IO finishes..
            clearTimeout(self.tickTimer)

            self.doCashOut(player, at, "CASHED_OUT", callback)
            io.emit("cashed_out", player)
            self.runTick()
        }

        self.doCashOut = (player, at, status = "CASHED_OUT", callback) => {
            try {
                let username = player.user.username
                let cashed = (player.bet * at) / 100
                let won = (player.bet * (at - 100)) / 100 // as in profit

                player.status = status
                player.stoppedAt = at
                player.bonus = 0
                player.profit = status == "LOSS" ? +player.bet * -1 : won

                self.openBet -= player.bet
                self.totalWon += won

                playersManager.updatePlayer(username, player)

                callback(null)
            } catch (er) {
                callback(er)
            }
        }

        self.runCashOuts = at => {
            let update = false // Check for auto cashouts
            try {
                Object.entries(playersManager.players).forEach(
                    ([username, player]) => {
                        if (
                            player.status === "CASHED_OUT" ||
                            player.status === "LOSS"
                        )
                            return

                        // Check user is pending crash
                        if (
                            player.auto_cash_out <= at &&
                            player.auto_cash_out <= self.forcePoint
                        ) {
                            self.doCashOut(
                                player,
                                player.auto_cash_out,
                                "CASHED_OUT",
                                err => {
                                    if (err)
                                        console.log(
                                            "[INTERNAL_ERROR] could not auto cashout ",
                                            username,
                                            " at ",
                                            player.auto_cash_out
                                        )
                                    else {
                                        io.emit("cashed_out", player)
                                    }
                                }
                            )

                            update = true
                        }
                    }
                )
            } catch (er) {
                console.log("ERROR", er.message)
            }

            if (update) self.setForcePoint()
        }

        self.cashOutAll = at => {
            self.runCashOuts(at)
            // cash out everyone not cash out
            try {
                Object.entries(playersManager.players).forEach(
                    ([username, player]) => {
                        if (player.status === "PLAYING") {
                            self.doCashOut(player, at, "LOSS", () => {})
                        }
                    }
                )
            } catch (er) {
                console.log("ERROR: ", er.message)
            }
        }

        // Calls callback with (err, booleanIfAbleToJoin)
        self.placeBet = (user, betAmount, autoCashOut, callback) => {
            if (self.state !== "STARTING") return callback("GAME_IN_PROGRESS")

            if (lib.hasOwnProperty(playersManager.players, user.username)) {
                delete playersManager.players[user.username]
                return callback("CANCEL_BETTING")
            }

            if (betAmount < 0) {
                delete playersManager.players[user.username]
                return callback("CANCEL_BETTING")
            }

            User.findById(user._id, "finances", (er, doc) => {
                if (!er && doc != null) {
                    if (doc.finances.free_coin > +betAmount) {
                        playersManager.pendingCount++
                        playersManager
                            .addPlayer({
                                user: {
                                    ...user,
                                    finances: {
                                        ...user.finances,
                                        net_profit: doc.finances.net_profit,
                                        gross_profit: doc.finances.gross_profit,
                                    },
                                },
                                game: self.game._id,
                                bet: betAmount,
                                auto_cash_out: autoCashOut,
                                stoppedAt: null,
                                bonus: null,
                                profit: null,
                                status: "PLAYING",
                            })
                            .then(player => {
                                self.bankroll += betAmount
                                self.openBet += betAmount

                                io.emit("bet", {
                                    game: player.game,
                                    player_id: player.user._id,
                                    user: {
                                        _id: player.user._id,
                                        username: player.user.username,
                                    },
                                    status: "PLAYING",
                                })
                                playersManager.pendingCount--
                                callback(null)
                            })
                            .catch(err => {
                                return callback(
                                    err.message || "NOT_ENOUGH_MONEY"
                                )
                            })
                    } else {
                        callback("NOT_ENOUGH_COIN")
                    }
                }
            })
        }

        self.getHistories = user =>
            new Promise((resolve, reject) => {
                Game.find({})
                    .sort({ updatedAt: -1 })
                    .select("crash_at ")
                    .limit(20)
                    .exec()
                    .then(data => {
                        // resolve(data.map(game => ({
                        //     ...game.toJSON(),
                        //     cashed_out: "-",
                        //     auto_cash_out: "-",
                        //     bet: "-",
                        //     profit: "-",
                        //     bonus: "-",
                        // })))
                        Promise.all(
                            data.map(
                                game =>
                                    new Promise(rs => {
                                        const defaultHistory = {
                                            ...game.toJSON(),
                                            cashed_out: "-",
                                            auto_cash_out: "-",
                                            bet: "-",
                                            profit: "-",
                                            bonus: "-",
                                        }
                                        if (user._id) {
                                            GamePlayer.findOne({
                                                player: user._id,
                                                game: game._id,
                                            })
                                                .select(
                                                    "bonus bet auto_cash_out cashed_out profit"
                                                )
                                                .then(game_player => {
                                                    if (game_player == null)
                                                        return Promise.reject(
                                                            "game player not found"
                                                        )
                                                    rs({
                                                        ...game.toJSON(),
                                                        auto_cash_out:
                                                            game_player.auto_cash_out ||
                                                            "-",
                                                        cashed_out:
                                                            game_player.cashed_out ||
                                                            "-",
                                                        bet:
                                                            game_player.bet ||
                                                            "-",
                                                        profit: game_player.profit
                                                            ? game_player.profit.toFixed(
                                                                  2
                                                              )
                                                            : "-",
                                                        bonus: game_player.bonus
                                                            ? game_player.bonus.toFixed(
                                                                  2
                                                              )
                                                            : "-",
                                                    })
                                                })
                                                .catch(er => {
                                                    rs(defaultHistory)
                                                })
                                        } else {
                                            rs(defaultHistory)
                                        }
                                    })
                            )
                        ).then(resolve)
                    })
                    .catch(reject)

                // Game.find({}).sort({ "updatedAt": -1 }).limit(20).exec((er, data) => er ? reject(er) : resolve(data));
            })

        // Hack: Assign this method here instead of putting it in the prototype,
        // because it needs runGame() and it also has to be accessible from sockets.
        self.resume = () => {
            // Check if its safe to run a new game.
            if (self.controllerIsRunning || self.state !== "ENDED")
                return console.log("Game still active")

            console.log("Game resuming")
            self.controllerIsRunning = true
            runGame()
        }

        // Hack: Just keeping together what belongs together.
        self.pause = () => {
            console.warn("Game is going to pause")
            self.controllerIsRunning = false
        }

        // Admin edit Algorithm
        self.editAlgorithm = async data => {
            try {
                let record = await Setting.findOne({ name: data.name })

                if (!record) {
                    let setting = new Setting(data)
                    setting.save()
                    record = await Setting.findOne({ name: data.name })
                }

                if (data.name === "coefficient") {
                    record.set({ description: "coefficient next round" })
                }

                record.set({ value: data.value })

                await record.save()
                switch (record.name) {
                    case "game_is_running": {
                        self.controllerIsRunning = !record.value
                        record.value ? self.resume() : self.pause()
                        break
                    }
                    case "coefficent": {
                        break
                    }
                }
            } catch (er) {
                console.log("SETTING ERROR", er.message)
            }
        }

        self.getTotalBot = () => {
            const totalBots = Object.values(playersManager.players).filter(
                isBot
            ).length
            // const totalBotsSettings = pathOr(0, ['bots_config', 'VIR_BOT_A', 'num_bot_play'])(self.algorithms)
            const totalCurrentLooperBots = self.getCurrentLooperBots()
            return totalBots === 0
                ? totalCurrentLooperBots
                : Math.min(totalCurrentLooperBots, totalBots)
        }

        self.getCurrentLooperBots = () => {
            const { looper_bots, current_looper } = self.algorithms.bots_config
            return looper_bots[current_looper] || 0
        }

        self.setupNextLooperBots = () => {
            const { looper_bots, current_looper } = self.algorithms.bots_config
            self.algorithms.bots_config.current_looper =
                current_looper + 1 >= looper_bots.length
                    ? 0
                    : current_looper + 1
        }

        self.setupNextLooperCrash = () => {
            let {
                arr: arr_looper_crash,
                current: current_looper,
            } = self.algorithms.looper_crash_all
            const sortLooper = arr_looper_crash.sort((a, b) => a - b)

            self.algorithms.looper_crash_all.current =
                current_looper + 1 > sortLooper.slice(-1)[0]
                    ? 0
                    : current_looper + 1
        }

        self.setupCoefficient = async () => {
            const game_auto = await Setting.findOne({ name: "run_game_auto" })
            if (game_auto && !game_auto.value) {
                self.autogame = false
                const coe = await Coefficient.findOne({ run: true })
                // if (self.position > coe.value.length - 1) {
                //   self.position = 0;
                // }
                if (coe && coe.value.length > 0) {
                    self.coefficient =
                        coe.value[
                            Math.floor(Math.random() * coe.value.length)
                        ] * 100
                    // console.log("adad",self.coefficient);
                    // self.coefficient = +(parseFloat(coe.value[self.position]) * 100);
                    // if (self.position == coe.value.length - 1) {
                    //   self.position = 0;
                    // } else {
                    //   self.position++;
                    // }
                } else {
                    self.autogame = true
                }
            } else {
                self.autogame = true
            }
        }
    }
}

module.exports = GameManager
