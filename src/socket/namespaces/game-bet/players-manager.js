const GamePlayer = require("../../../models/game_player")
const GameProfit = require("../../../models/game_profit")
const { ProfitService } = require("../../../services")
const { randInt } = require("../../../utils/func")

const getProfitByPlayer = player => {
    if (player.status === "CASHED_OUT") {
        return (
            parseFloat(+player.bet * ((player.stoppedAt - 100) / 100)) +
            parseFloat(+player.bonus)
        )
    } else {
        return +player.bet * -1 + +player.bonus
    }
}

const CreateBotsRandom = (BOTS, game) => {
    let _BOTS = BOTS

    return (num, bets, autoCashOut) => {
        let CHOOSEN_BOTS = _BOTS.slice(0, num)
        _BOTS = _BOTS.slice(num, _BOTS.length)

        return CHOOSEN_BOTS.map(bot => {
            return {
                user: {
                    username: bot.username,
                    _id: bot._id,
                    finances: bot.finances,
                },
                game: game._id,
                bet: randInt(...bets),
                auto_cash_out: randInt(...autoCashOut),
                stoppedAt: null,
                bonus: null,
                profit: null,
                status: "PLAYING",
                isBot: true,
                type_bot: bot.type_bot,
            }
        })
    }
}

function PlayersManager() {
    this.players = {} // An object of userName ->  { playId: ..., autoCashOut: .... }
    this.pendingCount = 0
    this.getRealPlayers = () =>
        Object.values(this.players).filter(this.isPlayer)

    this.createBots = async (bots_config, game, cb = () => {}) => {
        try {
            const { VIR_BOT_A, looper_bots, current_looper } = bots_config

            const num_bots_prev = looper_bots
                .slice(0, current_looper)
                .reduce((acc, cur) => acc + +cur, 0)
            const num_bots_cur = looper_bots[current_looper]
                ? +looper_bots[current_looper]
                : 0
            const countBots = await Bot.countDocuments()
            let skip = num_bots_prev
            let limit = num_bots_cur

            if (countBots < skip + limit) {
                skip = 0
                limit = looper_bots[0]
            }

            const VIR_BOTS_A = await Bot.find({ type_bot: "VIR_BOT_A" })
                .sort({
                    "finances.net_profit": -1,
                })
                .skip(skip)
                .limit(limit)
                .exec()

            let createBotsRandom = CreateBotsRandom(
                VIR_BOTS_A,
                VIR_BOT_A.auto_cash_out,
                game
            )

            let bots_play = [
                ...createBotsRandom(20, [10000, 50000], [101, 400]), //30
                ...createBotsRandom(20, [100, 1000], [400, 1000]), //20
                ...createBotsRandom(7, [1000000, 5000000], [170, 300]),
                ...createBotsRandom(5, [100000, 200000], [1000, 8000]),
                ...createBotsRandom(15, [50, 100000], [400, 1000]),
                ...createBotsRandom(8, [100000, 900000], [170, 300]),
                ...(skip + limit < 75
                    ? []
                    : createBotsRandom(
                          75 - (skip + limit),
                          [100, 1000],
                          [400, 1000]
                      )),
            ]

            cb(bots_play)

            bots_play = bots_play.reduce((cur, next) => {
                return {
                    ...cur,
                    [next.user.username]: next,
                }
            }, {})
            this.players = {
                ...this.players,
                ...bots_play,
            }
        } catch (er) {
            console.log("Can not get bots", er.message)
        }
    }

    this.isPlayer = player => player.isBot !== true
    this.isBot = player => player.isBot === true
    this.isWin = player => player.status === "CASHED_OUT"
    this.isLose = player => player.status !== "CASHED_OUT"

    this.addPlayer = player =>
        new Promise((rs, rj) => {
            // Check user MONEY before add
            this.players[player.user.username] = player
            rs(player)
        })

    this.updatePlayer = (username, player) => {
        this.players[username] = player
    }

    this.getPlayersBetted = () => {
        return this.players
    }

    this.getPlayers = () => {
        return this.players
    }

    this.getTotalBet = () => {
        return Object.values(this.players)
            .filter(this.isPlayer)
            .reduce((acc, player) => acc + +player.bet, 0)
    }

    this.totalWon = () => {
        return Object.values(this.players)
            .filter(this.isPlayer)
            .reduce(
                (acc, player) =>
                    this.isWin(player)
                        ? acc + +player.bet * (+player.stoppedAt / 100)
                        : acc,
                0
            )
    }

    this.totalBonus = () => {
        return Object.values(this.players)
            .filter(this.isPlayer)
            .reduce(
                (acc, player) => acc + 0, // TODO: calculate bonus here
                0
            )
    }

    this.payForWinners = total => {
        const winners = Object.values(this.players)
            .filter(this.isPlayer)
            .filter(this.isWin)
            .map(player => ({
                user_id: player.user._id,
                username: player.user.username,
                bet: player.bet,
                bonus: player.bonus,
                profit: getProfitByPlayer(player),
            }))

        return Promise.all(
            winners.map(winner =>
                ProfitService.updateFinancesByUserId(winner.user_id, {
                    free_coin_inc: winner.profit,
                    net_profit_inc: winner.profit,
                    gross_profit_inc: winner.profit,
                })
            )
        ).then(_ => {
            return winners
        })
    }

    this.deductFromLosers = () => {
        const losers = Object.values(this.players)
            .filter(this.isPlayer)
            .filter(this.isLose)
            .map(player => ({
                user_id: player.user._id,
                username: player.user.username,
                bet: player.bet,
                bonus: player.bonus,
                profit: getProfitByPlayer(player),
            }))

        return Promise.all(
            losers.map(winner =>
                ProfitService.updateFinancesByUserId(winner.user_id, {
                    free_coin_inc: winner.profit, // profit is < 0
                    net_profit_inc: winner.profit,
                    gross_profit_inc: 0,
                })
            )
        ).then(_ => {
            return losers
        })
    }

    this.updateBotsFinances = (bot_players = []) => {
        return Promise.all(
            bot_players.map(bot_player => {
                return new Promise((rs, rj) => {
                    Bot.findByIdAndUpdate(bot_player.bot, {
                        $inc: {
                            "finances.net_profit": bot_player.profit,
                            "finances.gross_profit":
                                bot_player.profit > 0 ? bot_player.profit : 0,
                        },
                    })
                        .then(rs)
                        .catch(rj)
                })
            })
        )
    }

    this.saveGameProfits = () => {
        Object.entries(this.players).map(async ([username, player]) => {
            if (!player.isBot) {
                const game_profit = await GameProfit.findOne({
                    player: player.user._id,
                })
                if (player.status == "CASHED_OUT") {
                    CommissionService.commission(
                        player.user,
                        player.profit,
                        player.bet
                    )
                }
                if (game_profit) {
                    if (player.status == "CASHED_OUT") {
                        game_profit.profit =
                            +game_profit.profit + +player.profit
                    }
                    game_profit.bet = +game_profit.bet + +player.bet
                    game_profit.total_profit =
                        +game_profit.total_profit + +player.profit
                    game_profit.save()
                } else {
                    GameProfit.create({
                        username: player.user.username,
                        player: player.user._id,
                        bet: player.bet,
                        profit: getProfitByPlayer(player),
                        total_profit: getProfitByPlayer(player),
                    })
                }
            }
        })
    }

    this.saveGamePlayers = () => {
        const game_players = Object.entries(this.players).map(
            ([username, player]) => {
                const isWin = this.isWin(player)
                const profit = getProfitByPlayer(player)
                const game_player = {
                    bot: player.isBot ? player.user._id : null,
                    player: player.isBot ? null : player.user._id,
                    game: player.game,
                    bet: player.bet,
                    auto_cash_out: player.auto_cash_out,
                    cashed_out: isWin ? player.stoppedAt : 0,
                    bonus: player.bonus,
                    profit,
                    player_net_profit:
                        +player.user.finances.net_profit + +profit,
                    player_gross_profit: isWin
                        ? +player.user.finances.gross_profit + +profit
                        : +player.user.finances.gross_profit,
                    is_bot: player.isBot ? true : false,
                }

                player.isBot
                    ? delete game_player.player
                    : delete game_player.bot
                return game_player
            }
        )

        this.updateBotsFinances(
            game_players.filter(game_player => game_player.is_bot)
        )

        return GamePlayer.insertMany(game_players)
    }

    this.findPlayer = cb => {
        return Object.values(this.players).filter(this.isPlayer).find(cb)
    }
}

module.exports = PlayersManager
