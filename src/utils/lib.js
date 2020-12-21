var crypto = require("crypto")

exports.isUUIDv4 = function (uuid) {
    return (
        typeof uuid === "string" &&
        uuid.match(
            /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
        )
    )
}

exports.isInt = function (nVal) {
    return (
        typeof nVal === "number" &&
        isFinite(nVal) &&
        nVal > -9007199254740992 &&
        nVal < 9007199254740992 &&
        Math.floor(nVal) === nVal
    )
}

exports.hasOwnProperty = function (obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName)
}

exports.getOwnProperty = function (obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName)
        ? obj[propName]
        : undefined
}

exports.genGameHash = function (serverSeed) {
    return crypto.createHash("sha256").update(serverSeed).digest("hex")
}

function divisible(hash, mod) {
    // We will read in 4 hex at a time, but the first chunk might be a bit smaller
    // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
    var val = 0

    var o = hash.length % 4
    for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod
    }

    return val === 0
}

// This will be the client seed of block 339300
var clientSeed =
    "000000000000000007a9a31ff7f07463d91af6b5454241d5faf282e5e0fe1b3a"

exports.crashPointFromHash = function (serverSeed) {
    var hash = crypto
        .createHmac("sha256", serverSeed)
        .update(clientSeed)
        .digest("hex")

    // In 1 of 101 games the game crashes instantly.
    if (divisible(hash, 101)) return 0

    // Use the most significant 52-bit from the hash to calculate the crash point
    var h = parseInt(hash.slice(0, 52 / 4), 16)
    var e = Math.pow(2, 52)

    return Math.floor((100 * e - h) / (e - h))
}
