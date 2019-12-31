#!/usr/bin/env node
const program = require('commander');
const brokerMain = require('../main');

program
    .option('-d, --debug', 'output extra debugging')
    .action(brokerMain.bind(this, process.env))
    .parse(process.argv);

