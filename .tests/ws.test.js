const { createConnection, openConection } = require('../src/ws');
const autobahn = require('autobahn');

const WS_ECHO = 'ws://crossbar:9000/ws';

describe('Websocket tests', () => {
    it(`should be defined`, () => {
        expect(createConnection).toBeDefined();
        expect(openConection).toBeDefined();
    });

    it(`createConnection should return a autobahn.Connection`, () => {
        let conn = createConnection({ url: WS_ECHO });
        expect(conn).toBeInstanceOf(autobahn.Connection);
    });

    // it(`createConnection should return a autobahn.Connection`, (done) => {
    //     let conn = createConnection({ url: WS_ECHO });
    //     openConection(conn)
    //         .then(resp => {
    //             expect(resp).toBeInstanceOf(autobahn.Session);
    //             done();
    //         }).catch(console.error);
    // });
});