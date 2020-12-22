const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CoefficientSchema = new Schema(
    {
        name: { type: String },
        value: [],
        run: { type: Boolean, default: false },
        position: { type: Number, default: 0 },
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

module.exports = mongoose.model("Coefficient", CoefficientSchema, "coefficient")
