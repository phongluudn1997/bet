const { pathOr, omit } = require('ramda');

const isBot = player => player.isBot;
const isPlayer = player => !player.isBot;
const isWin = player => player.status === "CASHED_OUT";
const isLose = player => player.status !== "CASHED_OUT";
const isPlaying = player => player.status === 'PLAYING';

const totalBet = (acc, player) => acc + +player.bet;
const totalWon = (acc, player) => isWin(player) ? acc + (+player.bet * (+player.stoppedAt / 100)) : acc;

const sortPlayersByBet = n => (a, b) => (+a.bet - +b.bet) * n;
const sortPlayerByCashedAt = n => (a, b) => (a.stoppedAt - b.stoppedAt) * n;
const sortPlayerByAutoCashOut = n => (a, b) => (a.auto_cash_out - b.auto_cash_out) * n;

function inverseGrowth(result) { // crashPoint -> time duration
    var c = 16666.666667;
    return c * Math.log(0.01 * result);
}

function growthFunc(ms) { // elapsed -> crashPoint
    var r = 0.00006;
    return Math.floor(100 * Math.pow(Math.E, r * ms));
}

function getMaxCrashPoint({
    players = {},
    discharge_coins = 0,
    suction_ratio = 0,
    bots_top_to_down_number = 1
}) {
    const allPlayers = Object.values(players).filter(isPlayer);
    const playingPlayers = allPlayers.filter(isPlaying);
    const winningPlayers = allPlayers.filter(isWin);

    const total_bet = allPlayers.reduce(totalBet, 0);
    const highest_bet = pathOr(0, [0, 'bet'], playingPlayers.sort(sortPlayersByBet(-1)));
    const total_coins = total_bet + discharge_coins;
    const total_suction = suction_ratio * total_bet;
    const total_won = winningPlayers.reduce(totalWon, 0);

    let max_crash_point = 1;

    // console.log('highest_bet', highest_bet)
    // console.log('total_bet', total_bet);
    // console.log('discharge_coins', discharge_coins);
    // console.log('total_coins', total_coins);
    // console.log('total_suction', total_suction);
    // console.log('total_won', total_won);

    if (highest_bet) {
        max_crash_point = (total_coins - (total_suction + total_won)) / (highest_bet)
        max_crash_point = max_crash_point < 1 ?
            pathOr(0, [0, 'stoppedAt'], winningPlayers.sort(sortPlayerByCashedAt(-1))) / 100
            : max_crash_point;
    } else {
        const bots = Object.values(players).filter(isBot).sort(sortPlayerByAutoCashOut(-1)).slice(bots_top_to_down_number);
        if (bots.length > 0) {
            if (winningPlayers.length > 0) {
                latestStoppedAt = pathOr(0, [0, 'stoppedAt'], winningPlayers.sort(sortPlayerByCashedAt(-1))) / 100;
                max_crash_point = bots[0].auto_cash_out / 100;
                max_crash_point = max_crash_point < latestStoppedAt ? latestStoppedAt : max_crash_point;
            } else {
                max_crash_point = bots[0].auto_cash_out / 100;
            }
        } else {
            if (winningPlayers.length > 0) {
                max_crash_point = pathOr(0, [0, 'stoppedAt'], winningPlayers.sort(sortPlayerByCashedAt(-1))) / 100
                max_crash_point = max_crash_point + 2;
            } else {
                max_crash_point = 1.8
            }
        }
    }

    return parseInt(max_crash_point * 100);
}


/**
 * Functions calculation for profit
 */

function getDischargeCoins(discharge_pool, discharge_algorithm) {
    const {
        minimum_amount,
        ratio_maximum,
        ratio_random
    } = discharge_algorithm;

    // nếu hồ chứa nhỏ hơn lượng xả tối thiểu thì không xả
    // ngược lại thì xả ratio_maximum * hồ chứa
    return +discharge_pool <= +minimum_amount ? 0 : +discharge_pool * (+ratio_maximum)
}

function getProfitPoolInc(algorithm, game_info, excess_cash) {
    const {
        discharge_coins,
        fee_taken
    } = game_info;

    return +discharge_coins >= +excess_cash ? 0 : (+fee_taken / 100) * (+excess_cash - +discharge_coins)
}

function getDischargePoolInc(algorithm, game_info, excess_cash) {
    const {
        discharge_coins,
        fee_taken
    } = game_info;

    return +discharge_coins >= +excess_cash ? (+excess_cash - +discharge_coins) : ((100 - fee_taken) / 100) * (+excess_cash - +discharge_coins)
}

function formatPlayerAtClientSide(player) {
    return {
        ...player,
        user: {
            username: player.user.username,
            _id: player.user._id
        }
    }
}

function formatPlayersAtClientSide(players) {
    return Object.entries(players).reduce((acc, [key, player]) => {
        return {
            ...acc,
            [key]: formatPlayerAtClientSide(player)
        }
    }, {})
}

module.exports = {
    inverseGrowth,
    growthFunc,
    getMaxCrashPoint,
    getDischargeCoins,
    getProfitPoolInc,
    getDischargePoolInc,
    formatPlayerAtClientSide,
    formatPlayersAtClientSide,
    isBot,
    isPlayer,
    isWin,
    isLose,
    isPlaying
}
