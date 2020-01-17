const logging = require('./src/logger');
const loggin = require('loggin-js');
const broker = require('./src/api');
const { q } = require('./src/consts');
const { createRcpServer, listenServer } = require('./src/rpc');
const { connect, createPublisher, sendMessage, createChannel, setConsumer, generateQueueNames } = broker;
const { createConnection, openConection, addMethods } = require('./src/ws');
const methods = require('./server/rpc-methods');
const jayson = require('jayson');

const RoutingMap = new Map();
RoutingMap.set('Pascual', 'Ximo');
// RoutingMap.set('Ximo', 'Juan');

const ResponseMap = new Map();

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
                logger.info('Procesing task: <%g' + name + '>', tasks[name]);

                // Generate queues
                const qname = generateQueueNames(name);
                const qin = await createChannel(conn, qname.in);
                const qout = await createChannel(conn, qname.out);
                const qerror = await createChannel(conn, qname.error);

                const qoutConsumer = setConsumer(qout, qname.out, async (msg) => {
                    logger.debug(`Consuming message from queue <%g${qname.out}>`);

                    let msgParsed = JSON.parse(msg.content.toString());
                    logger.debug(`Received message: <%b${msgParsed.id}>`);

                    // Ack message
                    qout.ack(msg);

                    // If a response is set for this message, we must sent it back to the requester  
                    if (ResponseMap.has(msgParsed.id)) {
                        const responseQueue = ResponseMap.get(msgParsed.id);
                        const outChannel = await createChannel(conn, responseQueue);

                        ResponseMap.delete(msgParsed.id);
                        logger.debug(`Sent message to <%g${responseQueue}>`);
                        return await sendMessage(outChannel, responseQueue, msg.content);
                    }

                    logger.debug(`Checking if it has routing key`);
                    // If routing key is found, we use it to move message to another queue
                    // This means it might receive a response from the task
                    if (RoutingMap.has(qname.base)) {
                        logger.debug(`Has routing key`);

                        // Get the routing queue name
                        const outQueue = RoutingMap.get(qname.base);
                        const qoutName = generateQueueNames(outQueue);

                        // Save a reference to the response receiver
                        if (msgParsed.id !== undefined) {
                            ResponseMap.set(msgParsed.id, qname.in);
                        }

                        const outChannel = await createChannel(conn, qoutName.in);

                        logger.debug(`Sent message to <%g${qoutName.in}>`);
                        await sendMessage(outChannel, qoutName.in, msg.content);
                    }
                    // If routing key is not found, we must send the message to the API through WS
                    else {
                        logger.debug(`Has routing key`);
                        logger.debug('Calling remote procedure (delegate)', msgParsed);

                        // Call remote procedure, and wait for result
                        wsSession.call('delegate', [null, msgParsed])
                            .then(
                                function ([err, res]) {
                                    logger.debug('[err, res]', [err, res]);
                                    const response = jayson.Utils.response(err, res, msgParsed.id);
                                    logger.info('Got result from (delegate)', response);

                                    // If there is an error send to error queue
                                    return sendMessage(qin, qname.in, JSON.stringify(response));
                                }
                            ).catch(err => rabbitLogger.error(err.message, err));
                    }
                });

                taskMap[name] = {
                    spec: tasks[name],
                    queues: {
                        qin,
                        qout: qoutConsumer,
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