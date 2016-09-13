'use strict';

var RingBuffer = require('ringbufferjs');

var DEFAULT_OPTS = {
    capacity: 50,
    prefix: ''
};

module.exports = NullStatsd;

function NullStatsd(opts, _buffer) {
    if (typeof opts === 'number') {
        opts = {
            capacity: opts
        };
    }

    if (!opts) {
        opts = DEFAULT_OPTS;
    }

    this._buffer = _buffer || new RingBuffer(
        opts.capacity || DEFAULT_OPTS.capacity
    );

    var prefix = opts.prefix;

    this.prefix = prefix ?
        (prefix[prefix.length - 1] === '.' ? prefix : prefix + '.') :
        '';
}

function NullStatsdRecord(type, name, value, delta, time) {
    this.type = type;
    this.name = name;
    this.value = typeof value === 'number' ? value : null;
    this.delta = typeof delta === 'number' ? delta : null;
    this.time = typeof time === 'number' ? time : null;
}

var proto = NullStatsd.prototype;

proto._write = function _write(record) {
    this._buffer.enq(record);
};

proto.gauge = function gauge(name, value) {
    this._write(new NullStatsdRecord('g', this.prefix + name, value));
};

proto.counter = function counter(name, value) {
    this._write(new NullStatsdRecord('c', this.prefix + name, null, value));
};

proto.increment = function increment(name, delta) {
    this._write(new NullStatsdRecord(
        'c',
        this.prefix + name,
        null,
        delta || 1
    ));
};

proto.decrement = function decrement(name, delta) {
    this._write(new NullStatsdRecord(
        'c',
        this.prefix + name,
        null,
        (-1 * Math.abs(delta || 1))
    ));
};

proto.timing = function timing(name, time) {
    this._write(new NullStatsdRecord(
        'ms',
        this.prefix + name,
        null,
        null,
        time
    ));
};

proto.close = function close() {
    for (var i = 0, len = this._buffer.size(); i < len; i++) {
        this._buffer.deq();
    }
};

proto.immediateGauge = function (name, value, cb) {
    this._write(new NullStatsdRecord(
        'g',
        this.prefix + name,
        value
    ));
    if (cb) {
        process.nextTick(cb);
    }
};

proto.immediateIncrement = function (name, delta, cb) {
    this._write(new NullStatsdRecord(
        'c',
        this.prefix + name,
        null,
        delta || 1
    ));
    if (cb) {
        process.nextTick(cb);
    }
};

proto.immediateDecrement = function (name, delta, cb) {
    this._write(new NullStatsdRecord(
        'c',
        this.prefix + name,
        null,
        (-1 * Math.abs(delta || 1))
    ));
    if (cb) {
        process.nextTick(cb);
    }
};

proto.immediateCounter = function (name, value, cb) {
    this._write(new NullStatsdRecord(
        'c',
        this.prefix + name,
        null,
        value
    ));
    if (cb) {
        process.nextTick(cb);
    }
};

proto.immediateTiming = function (name, time, cb) {
    this._write(new NullStatsdRecord(
        'ms',
        this.prefix + name,
        null,
        null,
        time
    ));
    if (cb) {
        process.nextTick(cb);
    }
};

proto.getChildClient = function(extraPrefix) {
    return new NullStatsd({
        prefix: this.prefix + extraPrefix
    }, this._buffer);
};
