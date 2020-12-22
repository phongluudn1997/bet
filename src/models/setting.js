const mongoose = require("mongoose")
const Schema = mongoose.Schema
const { v4: uuidv4 } = require("uuid")
const { AUTO_BET_SCRIPTS } = require("../utils/constant")

const SettingsSchema = new Schema(
    {
        name: {
            type: String,
            enum: [
                "game_is_running",
                // algorithm config variables
                "looper_crash_all",
                "shark_algorithm",
                "balance_algorithm",
                "suction_algorithm",
                "discharge_algorithm",
                "max_bet_profit",
                // v3 algortihms
                "v3_is_actived",
                // ...

                // pools
                "pools",
                // stuff
                "bots_config",
                "auto_bet_scripts",
                "f1_commission_fee",
                "user_online",
                "charge",
                "run_game_auto",
                "profit_percent",
                "coefficient",
            ],
            unique: true,
            required: true,
        },
        description: { type: String },
        value: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
)

/**
 * virtual
 */

/**
 * Method
 */

/**
 * Statics
 */

const dataMigrate = [
    {
        name: "pools",
        description: "Pools in game",
        value: {
            discharge_pool: 500,
            profit_pool: 0,
            discharge_wallet: 0, // New updated
        },
    },
    { name: "game_is_running", description: "Game is running", value: true },
    // algorithms
    {
        name: "looper_crash_all",
        description: "Looper to crash game",
        value: {
            arr: [3, 11, 23, 30],
            points: [101, 102, 104, 106, 107],
        },
    },
    {
        name: "shark_algorithm",
        description: "Kill shark algorithm",
        value: {
            time_rate: 5, // if current total bet >= average_total_bet * time_rate -> kill shark
            crash_at: 100,
        },
    },
    {
        name: "balance_algorithm",
        description: "Balance algorithm",
        value: {
            ratio: 0.03,
        },
    },
    {
        name: "suction_algorithm",
        description: "Suction algorithm",
        value: {
            ratio: 0.4,
            fees: 0.03,
        },
    },
    {
        name: "discharge_algorithm",
        description: "Discharge algorithm",
        value: {
            minimum_amount: 200,
            ratio_random: 0.7,
            ratio_maximum: 0.33,
        },
    },
    // V3 Algorithms
    {
        name: "v3_is_actived",
        description: "V3 is actived",
        value: false,
    },
    // stuff
    {
        name: "max_bet_profit",
        description: "Max bet and profit",
        value: {
            max_bet: 0,
            max_profit: 0,
        },
    },
    {
        name: "bots_config",
        description: "Bots config",
        value: {
            REAL_BOT: {
                num_bot_play: 50,
                auto_cash_out: [105, 1000],
                bet: [10, 520],
            },
            VIR_BOT_A: {
                num_bot_play: 50,
                auto_cash_out: [105, 1000],
                bet: [10, 520],
            },
            VIR_BOT_B: {
                num_bot_play: 50,
                auto_cash_out: [105, 1000],
                bet: [10, 520],
            },
            random_bots: [
                // for VIR_BOT
                {
                    id: uuidv4(),
                    num_bot_play: 10,
                    bet: [20, 300],
                    auto_cash_out: [2.0, 500.0],
                },
                {
                    id: uuidv4(),
                    num_bot_play: 10,
                    bet: [40, 600],
                    auto_cash_out: [60.0, 10000.0],
                },
            ],
            looper_bots: [50, 60, 70, 58],
        },
    },
    {
        name: "auto_bet_scripts",
        description: "Auto bet default scripts",
        value: AUTO_BET_SCRIPTS.map(script => ({
            ...script,
            id: uuidv4(),
        })),
    },
    {
        name: "f1_commission_fee",
        description: "F1 comission fee",
        value: 12, // %
    },
    {
        name: "user_online",
        description: "Users online",
        value: 400,
    },
    {
        name: "charge",
        description: "Charge withdraw",
        value: 0.5,
    },
    {
        name: "run_game_auto",
        description: "Run game auto",
        value: true,
    },
    {
        name: "profit_percent",
        description: "Profit percent",
        value: 0,
    },
]

SettingsSchema.statics.getMigrateData = function () {
    return dataMigrate
}

module.exports = mongoose.model("Setting", SettingsSchema, "setting")
