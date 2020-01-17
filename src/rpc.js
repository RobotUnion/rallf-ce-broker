const jayson = require('jayson');

// Creates an jayson.Server instance, with baseMethods attached
function createRcpServer(scope = {}, methods = {}) {
    var server = jayson.server({
        ...methods,
    });

    return server;
}

// Listen http
function listenServerHTTP(server, port = process.env.RPC_PORT) {
    server.http().listen(port || 3000);
    return server;
}

// Listen tcp
function listenServerTCP(server, port = process.env.RPC_PORT) {
    server.tcp().listen(port || 3000);
    return server;
}

module.exports = {
    createRcpServer,
    listenServer: {
        http: listenServerHTTP,
        tcp: listenServerTCP,
    }
}