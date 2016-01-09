'use strict';

var assert = require('assert');

module.exports = MultiStatsdClient;

function MultiStatsdClient(clients) {
    assert(
        Array.isArray(clients),
        'MultiStatsdClient requires an Array of statsd clients'
    );

    this.clients = clients.slice();
}

MultiStatsdClient.prototype.getChildClient = getChildClientMultiStatsd;
MultiStatsdClient.prototype.gauge = gaugeMultiStatsd;
MultiStatsdClient.prototype.counter = counterMultiStatsd;
MultiStatsdClient.prototype.increment = incrementMultiStatsd;
MultiStatsdClient.prototype.decrement = decrementMultiStatsd;
MultiStatsdClient.prototype.timing = timingMultiStatsd;
MultiStatsdClient.prototype.immediateGauge = immediateGaugeMultiStatsd;
MultiStatsdClient.prototype.immediateCounter = immediateCounterMultiStatsd;
MultiStatsdClient.prototype.immediateIncrement = immediateIncrementMultiStatsd;
MultiStatsdClient.prototype.immediateDecrement = immediateDecrementMultiStatsd;
MultiStatsdClient.prototype.immediateTiming = immediateTimingMultiStatsd;
MultiStatsdClient.prototype.close = closeMultiStatsd;

function getChildClientMultiStatsd(extraPrefix) {
    var clients = this.clients;
    var newClients = new Array(clients.length);

    for (var i = 0; i < clients.length; i++) {
        newClients[i] = clients[i].getChildClient(extraPrefix);
    }

    return new MultiStatsdClient(newClients);
}

function gaugeMultiStatsd(name, value) {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].gauge(name, value);
    }
}

function counterMultiStatsd(name, delta) {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].counter(name, delta);
    }
}

function incrementMultiStatsd(name, delta) {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].increment(name, delta);
    }
}

function decrementMultiStatsd(name, delta) {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].decrement(name, delta);
    }
}

function timingMultiStatsd(name, time) {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].timing(name, time);
    }
}

function immediateGaugeMultiStatsd(name, value, cb) {
    var clients = this.clients;
    var callback = multiCallback(clients.length, cb);

    for (var i = 0; i < clients.length; i++) {
        clients[i].immediateGauge(name, value, callback);
    }
}

function immediateCounterMultiStatsd(name, delta, cb) {
    var clients = this.clients;
    var callback = multiCallback(clients.length, cb);

    for (var i = 0; i < clients.length; i++) {
        clients[i].immediateCounter(name, delta, callback);
    }
}

function immediateIncrementMultiStatsd(name, delta, cb) {
    var clients = this.clients;
    var callback = multiCallback(clients.length, cb);

    for (var i = 0; i < clients.length; i++) {
        clients[i].immediateIncrement(name, delta, callback);
    }
}

function immediateDecrementMultiStatsd(name, delta, cb) {
    var clients = this.clients;
    var callback = multiCallback(clients.length, cb);

    for (var i = 0; i < clients.length; i++) {
        clients[i].immediateDecrement(name, delta, callback);
    }
}

function immediateTimingMultiStatsd(name, time, cb) {
    var clients = this.clients;
    var callback = multiCallback(clients.length, cb);

    for (var i = 0; i < clients.length; i++) {
        clients[i].immediateTiming(name, time, callback);
    }
}

function closeMultiStatsd() {
    var clients = this.clients;

    for (var i = 0; i < clients.length; i++) {
        clients[i].close();
    }
}

function multiCallback(count, cb) {
    var returnCount = 0;
    var values = [];

    return function callbackAfterCount(err, value) {
        if (err) {
            return cb(err);
        } else {
            values.push(value);
            returnCount++;

            if (returnCount === count) {
                return cb(null, values);
            }
        }
    };
}
