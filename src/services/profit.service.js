const Setting = require("../models/setting")
const { User } = require("../models/user")

const updatePools = ({ profit_pool_inc = 0, discharge_pool_inc = 0 } = {}) => {
    return Setting.findOneAndUpdate(
        {
            name: "pools",
        },
        {
            $inc: {
                "value.discharge_pool": discharge_pool_inc,
                "value.profit_pool": profit_pool_inc,
            },
        },
        {
            new: true,
        }
    )
}

const updateFinancesByUserId = (
    id,
    {
        free_coin_inc = 0,
        net_profit_inc = 0,
        gross_profit_inc = 0,
        withdrawals_inc = 0,
        deposits_inc = 0,
        commissions_inc = 0,
    } = {}
) => {
    return User.findByIdAndUpdate(
        id,
        {
            $inc: {
                "finances.free_coin": free_coin_inc,
                "finances.net_profit": net_profit_inc,
                "finances.gross_profit": gross_profit_inc,
                "finances.withdrawals": withdrawals_inc,
                "finances.deposits": deposits_inc,
                "finances.commissions": commissions_inc,
            },
        },
        {
            new: true,
            // select: '-password -two_step_authentication -role -refer_code -referred_by -blocked -wallet_address -email',
            select: "finances username",
        }
    ).exec()
}

module.exports = {
    updatePools,
    updateFinancesByUserId,
}
