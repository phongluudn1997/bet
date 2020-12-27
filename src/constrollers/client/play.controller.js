const renderPageGame = (req, res) => {
    res.render("index", {
        userAuth: req.session.userAuth,
        token: req.session.token,
    })
}

module.exports = {
    renderPageGame,
}
