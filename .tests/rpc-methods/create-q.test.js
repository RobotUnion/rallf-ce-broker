const loggin = require('loggin-js');
const createQueueFactory = require('../../server/rpc-methods/create-queue');
const broker = require('../../src/api');
const logging = require('../../src/logger');
const { q } = require('../../src/consts');
const { createRcpServer, listenServer } = require('../../src/comunication');
const { connect, createPublisher, createChannel, setConsumer, generateQueueNames } = broker;


describe('createQueueFactory', () => {
    it(`should be defined`, () => {
        expect(createQueueFactory).toBeDefined();
    });

    it(`should return function`, async (done) => {
        const conn = await connect('amqp://0.0.0.0');
        const apiErrorsPublisher = await createPublisher(conn, q.API_ERROR);

        // Setup loggers
        const brokerLogger = logging.default.clone({
            channel: 'broker-main',
            color: true,
            level:loggin.severity('DEBUG')
        });
        const fileLogger = logging.createFileLogger();
        const rabbitLogger = logging.createRabbitNotifier({ debug: true }, q.API_ERROR, apiErrorsPublisher);
        expect(typeof (createQueueFactory(null, { debug: true, logger: brokerLogger, errorLogger: rabbitLogger }))).toBe('function');

        done();
    });
});