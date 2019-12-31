const autobahn = require('autobahn');

function createConnection(opts = {}) {
    return new autobahn.Connection(opts)
}

function openConection(connection) {
    return new Promise((resolve, reject) => {
        connection.onopen = resolve;
        connection.onerror = reject;
        connection.open();
    });
}

function addSubscription(session, name, cb) {
    return session.subscribe(name, cb);
}

function addMethod(session, name, cb) {
    console.log('adding method', 'broker.' + name);
    return session.register('broker.' + name, cb);
}

function addBulk(items, cb) {
    if (Array.isArray(items)) {
        for (let item of items) {
            if (Array.isArray(item)) {
                cb(item[0], item[1]);
            }
            else if (typeof item === 'object') {
                cb(item.name, item.callback);
            }
        }
    } else if (typeof items === 'object') {
        for (let item in items) {
            cb(item, items[item]);
        }
    }
}

function addSubscriptions(session, subs) {
    addBulk(subs, addSubscription.bind(this, session));
}

function addMethods(session, subs) {
    addBulk(subs, addMethod.bind(this, session));
}


module.exports = {
    createConnection,
    openConection,
    addSubscriptions,
    addSubscription,
    addMethod,
    addMethods,
}