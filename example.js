#!/usr/bin/env node
const Duplex = require('stream').Duplex;
const se = require('.');

function noop() {}

//
// Setup the first bi-directional stream.
//

const a = new Duplex({
  read: noop,
  write(chunk, enc, cb) {
    b.push(chunk);
    cb();
  }
});

a.send = se.writer(a);
a.receive = se.reader(a);

//
// Setup the second bi-directional stream.
//

const b = new Duplex({
  read: noop,
  write(chunk, enc, cb) {
    a.push(chunk);
    cb();
  }
});

b.send = se.writer(b);
b.receive = se.reader(b);

//
// Try it out!
//

a.receive(console.log);
b.receive(console.log);

a.send('a:foo', {hello: 'world'});
b.send('b:foo');

process.nextTick(() => {
  // Add a listener for "b:ok"
  a.receive('b:ok', console.log);

  // Remove the catch-all listener.
  a.receive.off(console.log);

  // This event should only be handled once.
  b.send('b:ok', 200);
});
