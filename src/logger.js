const loggin = require('loggin-js');
const RabbitNotifier = require('./rabbit-notifier');

const createFileLogger = (opts = { color: true, formatter: 'detailed' }) => {
    const fileNotifier = loggin.notifier('file');
    const consoleNotifier = loggin.notifier('console');

    fileNotifier
        .pipe(loggin.severity('DEBUG'), opts.debugFile || './logs/all.log')
        .pipe(loggin.severity('ERROR'), opts.errorFile || './logs/error.log');

    return loggin.logger({
        ...opts,
        notifiers: [
            fileNotifier,
            consoleNotifier,
        ]
    });
}

const createRabbitNotifier = (opts = {}, queue, rabbitChannel) => {
    const consoleNotifier = loggin.notifier('console');
    const rabbitNotifier = new RabbitNotifier({ queue, rabbitChannel });

    return loggin.logger({
        ...opts,
        level: loggin.severity('ERROR'),
        notifiers: [
            rabbitNotifier,
            opts.debug ? consoleNotifier : null,
        ].filter(Boolean)
    })
};

module.exports = {
    createFileLogger,
    createRabbitNotifier,
    default: loggin.logger({
        color: true,
        formatter: 'detailed',
    })
}