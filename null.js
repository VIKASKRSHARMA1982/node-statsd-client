'use strict';

var NullStatsdClient = require('./lib/null-statsd-client.js');

module.exports = createNullStatsd;

function createNullStatsd(opts) {
    return new NullStatsdClient(opts);
}
