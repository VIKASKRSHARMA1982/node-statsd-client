var SDC = require('../lib/statsd-client.js');

var client = new SDC({
    prefix: 'bar'
});


var ITERATIONS = 10 * 1000 * 1000;

var start = Date.now();
var children = new Array(10);

for (var i = 0; i < ITERATIONS; i++) {
    var index = ITERATIONS % 10;

    children[index] = client.getChildClient('foo');
}

var end = Date.now();
console.log('time: ', end - start);

client.close();


