const logging = require('./src/logger');
const loggin = require('loggin-js');
const broker = require('./src/api');
const { q } = require('./src/consts');
const { createRcpServer, listenServer } = require('./src/comunication');
const { connect, createPublisher, createChannel, setConsumer, generateQueueNames } = broker;
const { createConnection, openConection, addMethods } = require('./src/ws');
const methods = require('./server/rpc-methods');

async function brokerMain(env, opts = {}) {
    try {
        // Connect to rabbit and create error queue
        const conn = await connect(env.RABBIT_URL);
        const errorQueue = await createPublisher(conn, q.API_ERROR);

        // Setup loggers
        const logger = logging.default.clone({
            channel: 'broker-main',
            color: true,
            level: env.DEBUG ? loggin.severity('DEBUG') : loggin.severity('INFO')
        });
        const fileLogger = logging.createFileLogger();
        const rabbitLogger = logging.createRabbitNotifier({ debug: true }, q.API_ERROR, errorQueue);

        logger.info('Launching broker');

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
                        qout,
                        qerror: setConsumer(qerror, `${name}:error`, (msg) => {
                            if (msg !== null) {
                                logger.error(msg.content.toString());
                                qerror.ack(msg);
                            }
                        }),
                    },
                };

                logger.debug('Created queues for: ' + name);
            }
        }

        logger.info('Processed tasks');

        // Setup rpc server (conection with daemon)
        const scope = { conn, taskMap, logger, broker, generateQueueNames };
        const rpcPort = (env.EXPOSE_PORT || 3000);
        const rpcServer = listenServer.http(
            createRcpServer(
                scope,
                methods.rpc(scope),
            ),
            rpcPort
        );
        logger.info(`Rpc server running at: ${rpcPort}`);


        // Websocket (connection to API)
        const wsUrl = (env.WS_URL || 'ws://localhost:9000/ws');
        const wsRealm = (env.WS_REALM || 'realm1');
        let wsConnection = createConnection({
            url: wsUrl,
            realm: wsRealm,
        });

        const wsSession = await openConection(wsConnection);
        const wsMethods = methods.ws(scope);
        addMethods(wsSession, wsMethods);

        logger.info(`Websocket running at: ${wsUrl} <${wsRealm}>`);
        logger.info(`Methods`, wsMethods);

        // Log requests
        rpcServer.on('request', (request) => {
            brokerLogger.debug('Got request <%g' + request.method + '>', request.params);
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = brokerMain;