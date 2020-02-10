#!/usr/bin/env node
const program = require('commander');
const brokerMain = require('../main');

process.env.TASKS = JSON.stringify({
    "test-task": {},
    "basic-example": {}
});

program
    .option('-d, --debug', 'output extra debugging')
    .action(brokerMain.bind(this, process.env))
    .parse(process.argv);

