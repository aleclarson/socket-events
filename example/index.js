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
    b.push(chunk, enc);
    cb();
  }
});

a.send = se.writer(a);
a.events = se.reader(a);

//
// Setup the second bi-directional stream.
//

const b = new Duplex({
  read: noop,
  write(chunk, enc, cb) {
    a.push(chunk, enc);
    cb();
  }
});

b.send = se.writer(b);
se.reader(b, b); // use the stream as our event emitter!

//
// Try it out!
//

a.events.on(console.log);
b.on('*', console.log);

// send nothing
a.send('a:foo');

// send an object
b.send('b:foo', {hello: 'world'});

// send a string
b.send('b:cow', 'm' + 'o'.repeat(50));

setTimeout(() => {
  // Add a listener for "b:ok"
  a.events.on('b:ok', console.log);

  // Remove the catch-all listener.
  a.events.off(console.log);

  // This event should only be handled once.
  b.send('b:ok', 200);
}, 100);
