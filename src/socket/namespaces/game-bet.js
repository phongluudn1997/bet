const lib = require("../../utils/lib")
const pareJwtToken = require("../../utils/func").pareJwtToken
const User = require("../../models/user")
const Setting = require("../../models/setting")
const { GAME_RESULT } = require("../../utils/constant")

const {
    GameManager,
    PlayersManager,
    Game,
    Player,
} = require("./game-bet/index")

const gameBet = io => {
    let usersSocket = {}
    let playersManager = new PlayersManager()

    let gameManager = new GameManager(io, playersManager)
    const game = new Game(io)
    game.start()

    const joined = async (clientSocket, jwtUser) => {
        usersSocket[clientSocket.id] = jwtUser
        emitUsersOnline()
        clientSocket.emit("connected")

        // Return all game status data for client connected
        const res = {
            error: {},
        }

        res.game_state = gameManager.state
        res.startTime = gameManager.startTime
        res.players = playersManager.getPlayers()
        res.max_bet_profit = gameManager.max_bet_profit

        clientSocket.emit("game_status", res)
        try {
            let game_histories = await gameManager.getHistories(jwtUser)
            clientSocket.emit("top-histories", game_histories)
        } catch (er) {
            res.error.game_histories = er.message || "ERROR_GET_HISTORIES"
            sendError(clientSocket, res.error)
        }
    }

    const listen = (clientSocket, jwtUser) => {
        joined(clientSocket, jwtUser)

        clientSocket.on("disconnect", () => {
            delete usersSocket[clientSocket.id]
            emitUsersOnline()
        })

        clientSocket.on("place_bet", ({ amount, prediction }, cb) => {
            if (!lib.isInt(amount)) {
                return sendError(
                    clientSocket,
                    "[place_bet] No invest amount: " + amount
                )
            }

            if (amount > 1e8)
                // 1 BTC limit
                return sendError(
                    clientSocket,
                    "[place_bet] Max bet size is 1 BTC got: " + amount
                ).placeBet({ amount, prediction })

            game.placeBet(
                { _id: 1000, username: "Phong Luu" },
                amount,
                prediction
            )

            clientSocket.emit("betted", {
                amount,
                prediction: GAME_RESULT[prediction],
            })

            if (typeof cb !== "function")
                return sendError(clientSocket, "[place_bet] No cb")

            // gameManager.placeBet(jwtUser, amount, autoCashOut, err => {
            //     if (err) {
            //         if (typeof err === "string") cb(err)
            //         else {
            //             // console.error('[INTERNAL_ERROR] unable to place bet, got: ', err);
            //             cb("INTERNAL_ERROR")
            //         }
            //         return
            //     }
            //     cb(null) // TODO: ... deprecate
            // })
        })

        clientSocket.on("stop-game", () => {
            game.stop()
            clientSocket.emit("game-stopped")
        })

        clientSocket.on("cash_out", ack => {
            if (!jwtUser)
                return sendError(clientSocket, "[cash_out] not logged in")

            if (typeof ack !== "function")
                return sendError(clientSocket, "[cash_out] No ack")

            gameManager.cashOut(jwtUser, function (err) {
                if (err) {
                    if (typeof err === "string") return ack(err)
                    else
                        return console.log(
                            "[INTERNAL_ERROR] unable to cash out: ",
                            err
                        ) // TODO: should we notify the user?
                }

                ack(null)
            })
        })

        clientSocket.on("my_account", (jwt_token, cb) => {
            User.findById(jwtUser._id, (er, doc) => {
                if (!er) {
                    cb({
                        _id: doc._id,
                        free_coin: doc.finances.free_coin,
                    })
                }
            })
        })

        clientSocket.on("user-onlines", emitUsersOnline)

        if (jwtUser && jwtUser.role === "ADMIN") {
            const adminSocket = clientSocket
            adminSocket.on(
                "admin_pause_game",
                gameManager.pause.bind(gameManager)
            )
            adminSocket.on(
                "admin_resume_game",
                gameManager.resume.bind(gameManager)
            )
            adminSocket.on(
                "admin_crash_all",
                gameManager.adminCrashGame.bind(gameManager)
            )
            adminSocket.on(
                "admin_coefficient",
                gameManager.adminCoefficientGame.bind(gameManager)
            ) //
            adminSocket.on(
                "edit_setting",
                gameManager.editAlgorithm.bind(gameManager)
            )
            adminSocket.on("reset_db", gameManager.resetDB.bind(gameManager))
        }
    }

    io.on("connection", clientSocket => {
        let jwtUser = {}
        jwtUser = pareJwtToken(clientSocket.handshake.query.token)
        console.log("Handshake with client, get Jwt", jwtUser)
        if (!jwtUser) {
            console.log("User is not login")
        }
        listen(clientSocket, jwtUser)
        // gameManager.resume()
    })

    function emitUsersOnline(cb = () => null) {
        Setting.findOne({ name: "user_online" }).then(data => {
            // const userOnlines = Object.values(usersSocket).length + gameManager.getTotalBot() + (data ? +data.value : +389)
            const userOnlines = Math.floor(
                Math.random() * 100 +
                    gameManager.getTotalBot() +
                    (data ? +data.value : +389)
            )
            io.emit("user-onlines", userOnlines)
            cb(userOnlines)
        })
    }

    function sendError(socket, description) {
        console.warn("Warning: sending client: ", description)
        socket.emit("err", description)
    }
}

module.exports = gameBet
