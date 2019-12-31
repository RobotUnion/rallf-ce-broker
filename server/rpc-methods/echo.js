module.exports = function (scope) {
    return function echo(args, callback) {
        callback(null, args);
    };
}