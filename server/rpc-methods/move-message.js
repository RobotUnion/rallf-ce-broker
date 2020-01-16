const jayson = require('jayson');
const { RCP_ERRORS } = require('../../src/consts');

// Factory for move
module.exports = function (scope) {
    const { conn, logger, broker } = scope;
    const { createChannel, sendMessage, setConsumer } = broker;
    const l = logger.clone({ channel: 'rpc:move' });

    // moves message to a specified {queue}:out
    return async function move(args, callback) {
        l.debug('Running handler', args);
        if (!args.from || !args.to) {
            l.error('Invalid parameters', args);
            return callback(this.error(RCP_ERRORS.INVALID_PARAMS));
        } else {
            const qin = args.to + ':in';
            const qout = args.from + ':out';

            const chin = await createChannel(conn, qin);
            const chout = await createChannel(conn, qout);

            setConsumer(chout, qout, async (msg) => {
                l.debug('Moving message', msg.content.toString());
                await sendMessage(chin, qin, msg.content);
 
                chout.ack(msg);
                callback(null, true);
            });
        }
    };
}