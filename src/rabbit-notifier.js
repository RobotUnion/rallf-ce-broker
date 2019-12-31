const loggin = require('loggin-js');
const rpiecy = require('json-rpiecy');
const { sendMessage } = require('./api');

// Loggin'JS Rabbit Notifier
class RabbitNotifier extends loggin.Notifier {
    constructor(options) {
        super(options, 'rabbit');
        this.lineIndex = 0;
        this.rabbitChannel = options.rabbitChannel;
        this.queue = options.queue;
    }

    output(message, log) {
        sendMessage(
            this.rabbitChannel,
            (log.data && log.data.queueName) || this.queue,
            new rpiecy.Notification('log', log).toString(),
        );
    }
}

module.exports = RabbitNotifier;