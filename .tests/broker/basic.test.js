
const jayson = require('jayson');
const broker = require('../../src/api');


fdescribe('Basic queue tests', () => {

    const testMessage = 'Hey there!';


    // create a client
    const client = jayson.client.http({
        port: 3000
    });
    function dispatchToPascual() {
        client.request('dispatch', { to: 'Pascual', body: { test: testMessage } }, function (err, response) {
            if (err) {
                console.log('err', err);
                throw err;
            }

            if (response.error) {
                console.log('response.error', response.error);
                throw response.error;
            }

            let res = response.result;
            console.log(res);
        });
    }


    fit(`broker dispatch to Pascual should move to Ximo`, async (done) => {
        console.log('URL: ', process.env.RABBIT_URL);
        const conn = await broker.connect(process.env.RABBIT_URL);
        const qName = 'Ximo:in';
        const qIn = await broker.createChannel(conn, qName);

        broker.setConsumer(qIn, qName, (msg) => {
            expect(msg).toBeTruthy();

            let parsed = JSON.parse(msg.content.toString());
            console.log('Received message ', parsed);
            expect(parsed.params.test).toEqual(testMessage);
            done();
        });
        dispatchToPascual();
    });
});