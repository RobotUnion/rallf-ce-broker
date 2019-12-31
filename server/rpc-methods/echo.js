module.exports = function (server, scope) {
    return function echo(args, callback) {
        callback(null, args);
    };
}