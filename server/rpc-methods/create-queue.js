const { RCP_ERRORS } = require('../../src/consts');

// Factory for createQueue
module.exports = function (scope) {
    const { conn, logger, broker } = scope;
    const { createChannel, generateQueueNames } = broker;
    const l = logger.clone({ channel: 'rpc:createQueue' });

    // creates queue set (in, out, err) for a specified name
    return async function createQueue(args, callback) {
        l.debug('Method createQueue', args);
        if (!args.name) {
            return callback(this.error(RCP_ERRORS.INVALID_PARAMS));
        }

        const qname = generateQueueNames(args.name);
        await createChannel(conn, qname.in);
        await createChannel(conn, qname.out);
        await createChannel(conn, qname.error);

        l.debug('created queues', qname);
        callback(null, qname);
    };
}