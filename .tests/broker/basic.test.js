
const jayson = require('jayson');
const broker = require('../../src/api');


fdescribe('Basic queue tests', () => {

    const testMessage = 'Hey there!';


    // create a client
    const client = jayson.client.http({
        port: 3000
    });
    function dispatchToPascual() {
        return new Promise((resolve, reject) => client.request('dispatch', { to: 'Pascual', body: { test: testMessage } },
            function (err, response) {
                if (err || response.error) {
                    reject(err || response.error);
                }

                resolve(response.result);
            }));
    }
    console.log('URL: ', process.env.RABBIT_URL);

    it(`broker dispatch to Pascual should move to Ximo`, async (done) => {
        const conn = await broker.connect(process.env.RABBIT_URL);
        const qName = 'Ximo:in';
        const qIn = await broker.createChannel(conn, qName);
        await qIn.purgeQueue(qName);

        broker.setConsumer(qIn, qName, (msg) => {
            qIn.ack(msg);
            expect(msg).toBeTruthy();

            let parsed = JSON.parse(msg.content.toString());
            console.log('Received message ', parsed);
            expect(parsed.params.test).toEqual(testMessage);
            done();
        });
        await dispatchToPascual();
    });

    it(`Response should return to Pascual:in queue`, async (done) => {
        const conn = await broker.connect(process.env.RABBIT_URL);

        const qNameXimo = 'Ximo:out';
        const qOutXimo = await broker.createChannel(conn, qNameXimo);
        await qOutXimo.purgeQueue(qNameXimo);

        const qNamePascual = 'Pascual:in';
        const qInPascual = await broker.createChannel(conn, qNamePascual);
        await qInPascual.purgeQueue(qNamePascual);

        let msgSent = await dispatchToPascual();
        console.log('Send message: ', msgSent);

        await broker.sendMessage(qOutXimo, qNameXimo, JSON.stringify(msgSent));
        console.log('Sent message: ', msgSent.id);

        broker.setConsumer(qInPascual, qNamePascual, (msg) => {
            qInPascual.ack(msg);
            expect(msg).toBeTruthy();

            let parsed = JSON.parse(msg.content.toString());
            console.log('Received message in Pascual', parsed.id);
            expect(parsed.id).toEqual(msgSent.id);
            done();
        });
    });

    it(`If no routing key, it should sent to API through WebSocket`, async (done) => {
        expect(false).toBeTruthy();
    });
});