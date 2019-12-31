const { createConnection, openConection, addSubscription } = require('../src/ws');

let conn = createConnection({
    url: 'ws://127.0.0.1:9000/ws',
    realm: 'realm1'
});
openConection(conn)
    .then(resp => {
        addSubscription(resp, 'com.myapp.hello', (e) => console.log(e));
    }).catch(console.error);

let conn2 = createConnection({
    url: 'ws://127.0.0.1:9000/ws',
    realm: 'realm1'
});
openConection(conn2)
    .then(resp => {
        resp.publish('com.myapp.hello', 'Hey');
    }).catch(console.error);