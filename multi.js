'use strict';

var MultiStatsdClient = require('./lib/multi-statsd-client.js');

module.exports = createMultiStatsd;

function createMultiStatsd(clients) {
    return new MultiStatsdClient(clients);
}
