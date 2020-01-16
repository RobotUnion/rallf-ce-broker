module.exports.rpc = (scope) => ({
    echo: require('./echo')(scope),
    createQueue: require('./create-queue')(scope),
    dispatch: require('./dispatch-message')(scope),
    read: require('./read-message')(scope),
    move: require('./move-message')(scope),
})

function wrapInPromise(fn, args) {
    return new Promise((resolve, reject) => {
        fn(args, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports.ws = (scope) => ({
    echo(args) {
        return wrapInPromise(require('./echo')(scope), args);
    },
    createQueue(args) {
        return wrapInPromise(require('./create-queue')(scope), args[0]);
    },
    dispatch(args) {
        return wrapInPromise(require('./dispatch')(scope), args);
    },
    read(args) {
        return wrapInPromise(require('./read')(scope), args);
    },
    move(args) {
        return wrapInPromise(require('./move')(scope), args);
    },
})