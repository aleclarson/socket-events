# socket-events

Inter-process communication with event emitters. Minimal surface area.

```js
import se from 'socket-events';

// in process A:
const emit = se.writer(socket); // `socket` must be writable

emit('foo', {hello: 'world'}); // sends '22;foo;{"hello":"world"};'
emit('bar');                   // sends '4;bar;'

// in process B:
const listen = se.reader(socket); // `socket` must be readable

listen('foo', (data) => {
  typeof data; // => 'object'
});

listen.off('foo', func); // remove one listener
listen.off('foo');       // remove all "foo" listeners
listen.off();            // remove all listeners
```

Readers avoid parsing the event body if the event name has no listeners.

The `se.writer` and `se.reader` functions work with any stream, not just
sockets!

### Catch-all listeners

If you want to handle every event, use a catch-all listener.

```js
// Either way works!
listen((name, data) => {});
listen('*', (name, data) => {});
```

### Duplex streams

TCP sockets are duplex streams, which means you can use both `se.reader`
and `se.writer` on the same socket for bi-directional events!

### Event serialization

Socket events have a length, an event name, and an event body.

```js
22;foo;{"hello":"world"};
```

The leading number indicates the number of UTF-8 characters that come after
its semi-colon.

The event name must not contain semi-colons or be empty.

The event body must be JSON-compliant, unless it's omitted.

```js
4;bar;  // an event with no body
```

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

## Install

```sh
npm install socket-events
```

## License

MIT
