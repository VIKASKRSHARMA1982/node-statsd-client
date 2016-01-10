'use strict';

var EphemeralSocket = require('./lib/ephemeral-socket.js');
var StatsdClient = require('./lib/statsd-client.js');

module.exports = createStatsdClient;

/*
 * Set up the statsd-client.
 *
 * Requires the `hostname`. Options currently allows for `port` and `debug` to
 * be set.
 */
function createStatsdClient(options) {
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

    return new StatsdClient(options, _ephemeralSocket);
}
