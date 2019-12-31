module.exports = (server, scope) => ({
    echo: require('./echo')(server, scope),
    createQueue: require('./create-queue')(server, scope),
    dispatch: require('./dispatch-message')(server, scope),
})