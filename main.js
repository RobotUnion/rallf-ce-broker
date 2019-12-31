const logging = require('./src/logger');
const loggin = require('loggin-js');
const broker = require('./src/api');
const { q } = require('./src/consts');
const { createRcpServer, listenServer } = require('./src/comunication');
const { connect, createPublisher, createChannel, setConsumer, generateQueueNames } = broker;

async function brokerMain(env, opts = {}) {
    try {
        // Connect to rabbit and create error queue
        const conn = await connect(env.RABBIT_URL);
        const apiErrorsPublisher = await createPublisher(conn, q.API_ERROR);

        // Setup loggers
        const brokerLogger = logging.default.clone({
            channel: 'broker-main',
            color: true,
            level: env.DEBUG ? loggin.severity('DEBUG') : loggin.severity('INFO')
        });
        const fileLogger = logging.createFileLogger();
        const rabbitLogger = logging.createRabbitNotifier({ debug: true }, q.API_ERROR, apiErrorsPublisher);

        brokerLogger.info('Launching broker');

        // Try generating queues for tasks passes in in env
        const taskMap = {};
        if (env.TASKS) {
            let tasks = JSON.parse(env.TASKS);
            let names = Object.keys(tasks);
            for (let name of names) {
                brokerLogger.debug('Procesing task: ' + name, tasks[name]);

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
                                brokerLogger.error(msg.content.toString());
                                qerror.ack(msg);
                            }
                        }),
                    },
                };

                brokerLogger.debug('Created queues for: ' + name);
            }
        }

        brokerLogger.info('Processed tasks');

        // Setup rpc server (conection with daemon)
        const rpcServer = listenServer.http(
            createRcpServer({ conn, errorQueue: apiErrorsPublisher, taskMap, logger: brokerLogger, broker, generateQueueNames }),
            3000
        );

        // TODO: Websocket connection to API

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