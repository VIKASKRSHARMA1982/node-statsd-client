'use strict';

var test = require('tape');

var createMultiStatsd = require('../multi.js');
var createNullStatsd = require('../null.js');

test('multi throws on non-array', function t(assert) {
    assert.throws(function testMultiConctuctor() {
        return createMultiStatsd();
    }, 'MultiStatsdClient requires an Array of statsd clients');
    assert.end();
});

test('empty multi statsd is a valid null statsd', function t(assert) {
    var client = createMultiStatsd([]);
    client.increment('foo');
    assert.strictEqual(client.clients.length, 0);
    assert.end();
});

test('close will close all child clients', function t(assert) {
    function MockClient() {
        this.closed = 0;
    }
    MockClient.prototype.close = function closeMockClient() {
        this.closed++;
    };

    var clients = [
        new MockClient(),
        new MockClient(),
        new MockClient()
    ];

    var multiClient = createMultiStatsd(clients);
    multiClient.close();

    for (var i = 0; i < clients.length; i++) {
        assert.strictEqual(clients[i].closed, 1);
    }

    assert.end();
});

test('first callback error is surfaced', function t(assert) {
    function MockClient() {
        this.closed = 0;
    }
    MockClient.prototype.immediateIncrement = immediateIncrementMockClient;

    function immediateIncrementMockClient(key, value, cb) {
        return cb(new Error('oops'));
    }

    var clients = [
        new MockClient()
    ];
    var multiClient = createMultiStatsd(clients);
    multiClient.immediateIncrement('foo', 1, onImmediateIncrement);

    function onImmediateIncrement(err) {
        assert.ok(err);
        assert.strictEqual(err.message, 'oops');
        assert.end();
    }
});

test('multi.gauge()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);

    m.gauge('some.key', 10);

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'g',
            name: 'some.key',
            value: 10,
            delta: null,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('multi.counter()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);

    m.counter('some.key', 5);

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key',
            value: null,
            delta: 5,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('multi.increment()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);

    m.increment('some.key');

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key',
            value: null,
            delta: 1,
            time: null
        });

        c._buffer.deq();
        c.increment('some.key2', 3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key2',
            value: null,
            delta: 3,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('multi.decrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);

    m.decrement('some.key');

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key',
            value: null,
            delta: -1,
            time: null
        });

        c._buffer.deq();
        c.decrement('some.key2', 3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key2',
            value: null,
            delta: -3,
            time: null
        });

        c._buffer.deq();
        c.decrement('some.key3', -3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'some.key3',
            value: null,
            delta: -3,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('multi.timing()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);

    m.timing('some.key', 500);

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'ms',
            name: 'some.key',
            value: null,
            delta: null,
            time: 500
        });

        c.close();
    }

    assert.end();
});

test('multi.immediateGauge()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);
    var cbCount = 0;

    m.immediateGauge('some.key', 10, function onImmediateGauge(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'g',
                name: 'some.key',
                value: 10,
                delta: null,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateCounter()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);
    var cbCount = 0;

    m.immediateCounter('some.key', 5, function onImmediateCounter(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key',
                value: null,
                delta: 5,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateIncrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);
    var cbCount = 0;

    m.immediateIncrement('some.key', 1, function onImmediateIncrement(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key',
                value: null,
                delta: 1,
                time: null
            });

            c._buffer.deq();
            c.increment('some.key2', 3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key2',
                value: null,
                delta: 3,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateDecrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);
    var cbCount = 0;

    m.immediateDecrement('some.key', 1, function onImmediateDecrement(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key',
                value: null,
                delta: -1,
                time: null
            });

            c._buffer.deq();
            c.decrement('some.key2', 3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key2',
                value: null,
                delta: -3,
                time: null
            });

            c._buffer.deq();
            c.decrement('some.key3', -3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'some.key3',
                value: null,
                delta: -3,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateTiming()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients);
    var cbCount = 0;

    m.immediateTiming('some.key', 500, function onImmediateTiming(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'ms',
                name: 'some.key',
                value: null,
                delta: null,
                time: 500
            });

            c.close();
        }

        assert.end();
    });
});

test('child multi.gauge()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');

    m.gauge('some.key', 10);

    for (var i = 0; i < clients.length; i++) {
        var c = m.clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'g',
            name: 'foo.some.key',
            value: 10,
            delta: null,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('child multi.counter()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');

    m.counter('some.key', 5);

    for (var i = 0; i < clients.length; i++) {
        var c = m.clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key',
            value: null,
            delta: 5,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('child multi.increment()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');

    m.increment('some.key');

    for (var i = 0; i < clients.length; i++) {
        var c = m.clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key',
            value: null,
            delta: 1,
            time: null
        });

        c._buffer.deq();
        c.increment('some.key2', 3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key2',
            value: null,
            delta: 3,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('child multi.decrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');

    m.decrement('some.key');

    for (var i = 0; i < clients.length; i++) {
        var c = m.clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key',
            value: null,
            delta: -1,
            time: null
        });

        c._buffer.deq();
        c.decrement('some.key2', 3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key2',
            value: null,
            delta: -3,
            time: null
        });

        c._buffer.deq();
        c.decrement('some.key3', -3);

        assert.deepEqual(c._buffer.peek(), {
            type: 'c',
            name: 'foo.some.key3',
            value: null,
            delta: -3,
            time: null
        });

        c.close();
    }

    assert.end();
});

test('child multi.timing()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');

    m.timing('some.key', 500);

    for (var i = 0; i < clients.length; i++) {
        var c = m.clients[i];

        assert.deepEqual(c._buffer.peek(), {
            type: 'ms',
            name: 'foo.some.key',
            value: null,
            delta: null,
            time: 500
        });

        c.close();
    }

    assert.end();
});

test('multi.immediateGauge()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');
    var cbCount = 0;

    m.immediateGauge('some.key', 10, function onImmediateGauge(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = m.clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'g',
                name: 'foo.some.key',
                value: 10,
                delta: null,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateCounter()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');
    var cbCount = 0;

    m.immediateCounter('some.key', 5, function onImmediateCounter(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = m.clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key',
                value: null,
                delta: 5,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateIncrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');
    var cbCount = 0;

    m.immediateIncrement('some.key', 1, function onImmediateIncrement(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = m.clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key',
                value: null,
                delta: 1,
                time: null
            });

            c._buffer.deq();
            c.increment('some.key2', 3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key2',
                value: null,
                delta: 3,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateDecrement()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');
    var cbCount = 0;

    m.immediateDecrement('some.key', 1, function onImmediateDecrement(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = m.clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key',
                value: null,
                delta: -1,
                time: null
            });

            c._buffer.deq();
            c.decrement('some.key2', 3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key2',
                value: null,
                delta: -3,
                time: null
            });

            c._buffer.deq();
            c.decrement('some.key3', -3);

            assert.deepEqual(c._buffer.peek(), {
                type: 'c',
                name: 'foo.some.key3',
                value: null,
                delta: -3,
                time: null
            });

            c.close();
        }

        assert.end();
    });
});

test('multi.immediateTiming()', function t(assert) {
    var clients = [
        createNullStatsd(),
        createNullStatsd(),
        createNullStatsd()
    ];

    var m = createMultiStatsd(clients).getChildClient('foo');
    var cbCount = 0;

    m.immediateTiming('some.key', 500, function onImmediateTiming(err) {
        assert.ifError(err);
        assert.strictEqual(cbCount, 0);

        cbCount++;

        for (var i = 0; i < clients.length; i++) {
            var c = m.clients[i];

            assert.deepEqual(c._buffer.peek(), {
                type: 'ms',
                name: 'foo.some.key',
                value: null,
                delta: null,
                time: 500
            });

            c.close();
        }

        assert.end();
    });
});
