const { createRcpServer, listenServer } = require('../src/comunication');
const rpcServer = listenServer.tcp(
    createRcpServer(),
    3000,
);
