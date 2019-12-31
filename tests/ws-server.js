const { createConnection, openConection, addSubscription } = require('../src/ws');

let conn = createConnection({
    url: process.env.CBURL || 'ws://127.0.0.1:9000/ws',
    realm: process.env.CBREALM || 'realm1'
});
openConection(conn)
    .then(session => {
        setInterval(() => {
            session.call('broker.createQueue', [{ name: 'test' }]).then(
                function (res) {
                    console.log("Result:", res);
                }
            );
        }, 10000);
    }).catch(console.error);

// let conn2 = createConnection({
//     url: 'ws://127.0.0.1:9000/ws',
//     realm: 'realm1'
// });
// openConection(conn2)
//     .then(resp => {
//         resp.publish('com.myapp.hello', 'Hey');
//     }).catch(console.error);