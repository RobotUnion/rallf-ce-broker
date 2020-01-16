const jayson = require('jayson');
const { RCP_ERRORS } = require('../../src/consts');

// Factory for dispatch
module.exports = function (scope) {
    const { conn, logger, broker, rabbitLogger } = scope;
    const { createChannel, sendMessage } = broker;
    const l = logger.clone({ channel: 'rpc:dispatch' });

    // Dispatches message to a specified {queue}:in
    return async function dispatch(args, callback) {
        l.debug('Running handler', args);
        if (!args.to || !args.body) {
            l.error('Invalid parameters', args);
            return callback(this.error(RCP_ERRORS.INVALID_PARAMS));
        } else {
            l.debug('sending message', args);

            const request = jayson.Utils
                .request('action', args.body, jayson.Utils.generateId(), {
                    version: 2,
                });

            const q = args.to + ':out';
            const ch = await createChannel(conn, q);
            await sendMessage(ch, q, JSON.stringify(request));

            l.debug('sent message', request);
            
            rabbitLogger.info('sent message', request);

            callback(null, request);
        }
    };
}