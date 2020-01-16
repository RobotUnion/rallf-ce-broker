const logging = require('./src/logger');
const loggin = require('loggin-js');
const broker = require('./src/api');
const { q } = require('./src/consts');
const { createRcpServer, listenServer } = require('./src/comunication');
const { connect, createPublisher, sendMessage, createChannel, setConsumer, generateQueueNames } = broker;
const { createConnection, openConection, addMethods } = require('./src/ws');
const methods = require('./server/rpc-methods');
const jayson = require('jayson');

const RoutingMap = new Map();
// RoutingMap.set('Pascual', 'Ximo');
RoutingMap.set('Ximo', 'Juan');

async function brokerMain(env, opts = {}) {
    try {
        // Connect to rabbit and create error queue
        const conn = await connect(env.RABBIT_URL);
        const errorQueue = await createPublisher(conn, q.API_ERROR);

        // Setup loggers
        const logger = logging.default.clone({
            channel: 'broker-main',
            color: true,
            level: (env.DEBUG || opts.debug) ? loggin.severity('DEBUG') : loggin.severity('INFO')
        });
        const fileLogger = logging.createFileLogger();
        const rabbitLogger = logging.createRabbitNotifier({ debug: true }, q.API_ERROR, errorQueue);

        const scope = { conn, logger, rabbitLogger, broker, generateQueueNames };
        const rpcPort = (env.EXPOSE_PORT || 3000);
        const wsUrl = (env.WS_URL || 'ws://localhost:9000/ws');
        const wsRealm = (env.WS_REALM || 'realm1');

        logger.info('Launching broker', { rpcPort, wsUrl, wsRealm });

        // Websocket (connection to API)
        let wsConnection = createConnection({
            url: wsUrl,
            realm: wsRealm,
        });

        const wsSession = await openConection(wsConnection);
        const wsMethods = methods.ws(scope);
        addMethods(wsSession, wsMethods);

        logger.info(`Websocket running at: ${wsUrl} <${wsRealm}>`);
        logger.info(`Methods`, wsMethods);

        // Try generating queues for tasks passes in in env
        const taskMap = {};
        if (env.TASKS) {
            let tasks = JSON.parse(env.TASKS);
            let names = Object.keys(tasks);
            for (let name of names) {
                logger.debug('Procesing task: ' + name, tasks[name]);

                const qname = generateQueueNames(name);
                const qin = await createChannel(conn, qname.in);
                const qout = await createChannel(conn, qname.out);
                const qerror = await createChannel(conn, qname.error);

                taskMap[name] = {
                    spec: tasks[name],
                    queues: {
                        qin,
                        qout: setConsumer(qout, qname.out, async (msg) => {
                            logger.debug(`Consuming message from queue <%g${qname.out}>`);
                            let outQueue = RoutingMap.get(qname.base);
                            qout.ack(msg);
                            if (outQueue) {
                                const qoutName = generateQueueNames(outQueue);
                                const outChannel = await createChannel(conn, qoutName.in);
                                await sendMessage(outChannel, qoutName.in, msg.content);
                            } else {
                                let dataParsed = JSON.parse(msg.content.toString());
                                logger.debug('Calling remote procedure (delegate)', dataParsed);
                                wsSession.call('delegate', [null, dataParsed]).then(
                                    function ([err, res]) {
                                        const response = jayson.Utils.response(err, res, dataParsed.id);

                                        logger.debug('Got result from (delegate)', response);
                                        return sendMessage(qin, qname.in, JSON.stringify(response));
                                    }
                                );
                            }
                        }),
                        qerror,
                    },
                };

                logger.debug('Created queues for: ' + name);
            }
        }

        logger.info('Processed tasks');

        // Setup rpc server (conection with daemon)
        const rpcServer = listenServer.http(
            createRcpServer(
                scope,
                methods.rpc(scope),
            ),
            rpcPort
        );
        logger.info(`Rpc server running at: ${rpcPort}`);

        // Log requests
        rpcServer.on('request', (request) => {
            logger.debug('Got request <%g' + request.method + '>', request.params);
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = brokerMain;