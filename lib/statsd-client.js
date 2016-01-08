'use strict';

var EphemeralSocket = require('./ephemeral-socket.js');
var Messages = require('./messages.js');

function StatsdClientOptions(prefix, isDisabled, dnsResolver) {
    this.prefix = prefix;
    this.isDisabled = isDisabled;
    this.dnsResolver = dnsResolver;
}

function StatsDClient(options, _ephemeralSocket) {
    this.options = options;
    this._ephemeralSocket = _ephemeralSocket;

    if (this.options.prefix && this.options.prefix !== '') {
        this.options.prefix = enforceDotOnPrefix(this.options.prefix);
    }
}

function enforceDotOnPrefix(prefix) {
    return prefix[prefix.length - 1] === '.' ? prefix : prefix + '.';
}

/*
 * Set up the statsd-client.
 *
 * Requires the `hostname`. Options currently allows for `port` and `debug` to
 * be set.
 */
function createStatsDClient(options) {
    options = options || {};
    options.prefix = options.prefix || '';
    options.isDisabled = options.isDisabled || null;

    var _ephemeralSocket = (options && options._ephemeralSocket) ||
        new EphemeralSocket(options);

    if (options.dnsResolver &&
        _ephemeralSocket.resolveDNS &&
        !_ephemeralSocket._dnsResolver
    ) {
        _ephemeralSocket.resolveDNS(options.dnsResolver);
    }

    return new StatsDClient(options, _ephemeralSocket);
}

/*
 * Get a "child" client with a sub-prefix.
 */
StatsDClient.prototype.getChildClient = function (extraPrefix) {
    return new StatsDClient(
        new StatsdClientOptions(
            this.options.prefix + extraPrefix,
            this.options.isDisabled,
            this.options.dnsResolver
        ),
        this._ephemeralSocket
    );
};

/*
 * gauge(name, value)
 */
StatsDClient.prototype.gauge = function (name, value) {
    name = this.options.prefix + name;
    var message = new Messages.Gauge(name, value);
    this._ephemeralSocket._writeToSocket(message.toString());
};

/*
 * counter(name, delta)
 */
StatsDClient.prototype.counter = function (name, delta) {
    name = this.options.prefix + name;
    var message = new Messages.Counter(name, delta);
    this._ephemeralSocket.send(message.toString());
};

/*
 * increment(name, [delta=1])
 */
StatsDClient.prototype.increment = function (name, delta) {
    if (delta === 0) {
        return;
    }
    this.counter(name, Math.abs(delta || 1));
};

/*
 * decrement(name, [delta=-1])
 */
StatsDClient.prototype.decrement = function (name, delta) {
    if (delta === 0) {
        return;
    }
    this.counter(name, -1 * Math.abs(delta || 1));
};

/*
 * timings(name, date-object | ms)
 */
StatsDClient.prototype.timing = function (name, time) {
    // Date-object or integer?
    var t = time instanceof Date ? new Date() - time : time;

    name = this.options.prefix + name;
    var message = new Messages.Timing(name, t);
    this._ephemeralSocket.send(message.toString());
};

/*
 * immediateGauge(name, delta)
 */
 StatsDClient.prototype.immediateGauge = function (name, value, cb) {
    name = this.options.prefix + name;
    var message = new Messages.Gauge(name, value);
    this._ephemeralSocket._writeToSocket(message.toString(), cb);
 }

/*
 * immediateCounter(name, delta)
 */
StatsDClient.prototype.immediateCounter = function (name, delta, cb) {
    name = this.options.prefix + name;
    var message = new Messages.Counter(name, delta);
    this._ephemeralSocket._writeToSocket(message.toString(), cb);
}

/*
 * immediateIncrement(name, [delta=1])
 */
StatsDClient.prototype.immediateIncrement = function (name, delta, cb) {
    if (delta === 0) {
        return;
    }
    this.immediateCounter(name, Math.abs(delta || 1), cb);
}

/*
 * immediateDecrement(name, [delta=-1])
 */
StatsDClient.prototype.immediateDecrement = function (name, delta, cb) {
    if (delta === 0) {
        return;
    }
    this.immediateCounter(name, -1 * Math.abs(delta || 1), cb);
};

/*
 * immediateTimings(name, date-object | ms)
 */
StatsDClient.prototype.immediateTiming = function (name, time, cb) {
    // Date-object or integer?
    var t = time instanceof Date ? new Date() - time : time;

    name = this.options.prefix + name;
    var message = new Messages.Timing(name, t);
    this._ephemeralSocket._writeToSocket(message.toString(), cb);
};

/*
 * Close the socket, if in use and cancel the interval-check, if running.
 */
StatsDClient.prototype.close = function () {
    this._ephemeralSocket.close();
};

module.exports = createStatsDClient;
