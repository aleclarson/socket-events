# socket-events

[![npm version](https://badge.fury.io/js/socket-events.svg)](https://www.npmjs.com/package/socket-events)
[![](https://david-dm.org/aleclarson/socket-events.svg)](https://www.npmjs.com/package/socket-events)
[![Gitter](https://img.shields.io/gitter/room/socket-events/support.svg)](https://gitter.im/socket-events/support)

Minimal RPC with event emitters

Compatible with NodeJS 6.0.0+

```js
const se = require('socket-events');

// emit JSON events using any writable stream
const emit = se.writer(socket);

emit('foo', {hello: 'world'}); // emits '22;foo;{"hello":"world"};'
emit('bar');                   // emits '4;bar;'

// handle the events using any readable stream
const events = se.reader(socket, {
  foo: (data) => console.log('foo:', data),
  bar: () => console.log('bar'),
  '*': (name, data) => console.log({name, data}),
});

// bring your own event emitter (optional)
const EventEmitter = require('events');
const events = new EventEmitter();
se.reader(socket, events);

// use the encoder and decoder directly
const decode = se.decoder(events);
socket.on('data', decode);
socket.write(se.encode('foo', {hello: 'world'}));
```

Sockets are duplex streams, which means you can use both `se.reader` and `se.writer` on the same socket for bi-directional events.

The `se.writer` and `se.reader` functions work with any stream, not just sockets.

The decoder avoids parsing the event body if an event has no listeners.

&nbsp;

### Event emitters

The `se.reader` function can be passed any object with an `emit` method like this:
- `emit(name: string, arg1: any, arg2: any) : any`

The `se.events` function returns a custom `EventEmitter` object that is highly optimized for the minimal use case. There is no support for one-time listeners, `addListener` or `removeListener` events, or `error` events that throw when no listeners exist. You should provide `se.reader` with an instance of node's built-in `EventEmitter` class for those features.

```js
// add listeners via the constructor
const ee = se.events({
  foo: console.log, // values can be functions
  bar: [],          // or arrays of functions
});

// listen to all events
ee.on('*', (name, data) => {});

// listen to one event
const listener = ee.on('foo', (data) => {});

// emit an event manually
ee.emit('foo', 123);

// remove a listener
ee.off('foo', listener);

// remove all listeners of an event
ee.clear('foo');

// remove all listeners of all events
ee.clear();
```

&nbsp;

### Event serialization

Socket events have a length, an event name, and an event body.

```js
22;foo;{"hello":"world"};
```

The leading number indicates the number of bytes that come after its semi-colon.

The event name must not contain semi-colons or be empty.

The event body must be JSON-compliant, unless it's omitted.

```js
4;bar;  // an event with no body
```

&nbsp;

### `encode` and `decoder`

The `encode` and `decoder` functions are used internally and in tests.

```js
const msg = se.encode('foo', 1); // => '6;foo;1;'
se.decoder({
  foo(data) {
    console.log(data); // => 1
  }
})(msg);
```

&nbsp;

## Install

```sh
npm install socket-events
```

## License

MIT
