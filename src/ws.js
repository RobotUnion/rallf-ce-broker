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

function addSubscriptions(session, subs = []) {
    for (let sub of subs) {
        if (Array.isArray(sub)) {
            session.subscribe(sub[0], sub[1]);
        }
        else if (typeof sub === 'object') {
            session.subscribe(sub.name, sub.callback);
        }
    }
}


module.exports = {
    createConnection,
    openConection,
    addSubscriptions,
    addSubscription,
}