const jayson = require('jayson');
const { RCP_ERRORS } = require('../../src/consts');

// Factory for dispatch
module.exports = function (scope) {
    const { conn, logger, broker } = scope;
    const { createChannel, setConsumer, getMessage } = broker;
    const l = logger.clone({ channel: 'rpc:read' });

    // Dispatches message to a specified {queue}:in
    return async function readMessage(args, callback) {
        l.debug('Running readMessage handler', args);
        if (!args.from) {
            l.error('Invalid parameters', args);
            return callback(this.error(RCP_ERRORS.INVALID_PARAMS));
        } else {
            const q = args.from + ':in';
            l.debug('reading message from ' + q);

            const ch = await createChannel(conn, q);
            await getMessage(ch, q, (msg) => {
                l.debug('Got message', msg.content.toString());
                callback(null, msg);
            });
        }
    };
}