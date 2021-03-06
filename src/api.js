const amqp = require('amqplib');

function generateQueueNames(name) {
    return {
        in: `${name}:in`,
        out: `${name}:out`,
        error: `${name}:error`,
        base: name
    };
}

function connect(url) {
    return amqp.connect(url);
}

function createChannel(conn, q) {
    return conn.createChannel()
        .then(async ch => {
            if (q) {
                await setQueue(ch, q);
            }

            return ch;
        });
}

function createQueue(ch, q) {
    return ch.assertQueue(q);
}

function setConsumer(ch, q, cb) {
    return ch.consume(q, cb);
}

function getMessage(ch, q, cb) {
    return ch.consume(q, cb);
}

function setQueue(ch, queue) {
    return ch.assertQueue(queue);
}

function createConsumer(conn, q) {
    return createChannel(conn, q)
}

async function createPublisher(conn, q) {
    return createChannel(conn, q);
}

function sendMessage(ch, q, buffer) {
    // Add error checking here, must be a valid rpc

    buffer = Buffer.isBuffer(buffer)
        ? buffer
        : Buffer.from(buffer);

    return ch.sendToQueue(q, buffer);
}

function getPubCons(conn, q) {
    return Promise.all([
        createPublisher(conn, q),
        createConsumer(conn, q),
    ]);
}

module.exports = {
    connect,
    createChannel,
    createQueue,
    createConsumer,
    createPublisher,
    getPubCons,
    getMessage,
    setConsumer,
    setQueue,
    sendMessage,
    generateQueueNames,
};