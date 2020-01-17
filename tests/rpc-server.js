const { createRcpServer, listenServer } = require('../src/rpc');
const rpcServer = listenServer.tcp(
    createRcpServer(),
    3000,
);
