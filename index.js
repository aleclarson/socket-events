'use strict';
const isReadable = require('is-stream').readable;
const isWritable = require('is-stream').writable;

const se = exports;

se.EventEmitter = require('./events');

se.events = function(events) {
  return new se.EventEmitter(events);
};

se.reader = function(stream, events) {
  if (isReadable(stream)) {
    if (!events || typeof events.emit !== 'function') {
      events = se.events(events);
    }
    stream.on('data', decoder(events));
    return events;
  }
  throw TypeError('`stream` must be readable');
};

se.writer = function(stream) {
  if (isWritable(stream)) {
    return function emit(name, data) {
      stream.write(encode(name, data));
    };
  }
  throw TypeError('`stream` must be writable');
};

se.encode = encode;
function encode(name, data) {
  if (typeof name !== 'string' || name === '') {
    throw Error('Invalid event name: ' + (JSON.stringify(name) || String(name)));
  }
  const json = data != null ? JSON.stringify(data) : null;
  const length = 1 + Buffer.byteLength(name) + (json ? 1 + Buffer.byteLength(json) : 0);
  return length + ';' + name + ';' + (json ? json + ';' : '');
}

se.decoder = decoder;
function decoder(events) {
  // Bind `emit` for use with `process.nextTick`
  const emit = events.emit.bind(events);

  let buf = '', len = 0, name = '';
  return function(chunk) {
    if (!Buffer.isBuffer(chunk)) {
      chunk = Buffer.from(chunk);
    }
    let i = 0, size = chunk.length;
    while (i < size) {
      // Parse the event length.
      if (len === 0) {
        let sep = chunk.indexOf(';', i);
        if (sep === -1) {
          buf += chunk.toString('utf8', i);
          return;
        }

        // The length is known.
        len = Number(buf + chunk.toString('utf8', i, sep));
        buf = '';

        // Continue past the length.
        i = sep + 1;
      }

      // Parse the event name.
      if (name === '') {
        let sep = chunk.indexOf(';', i);
        if (sep === -1) {
          buf += chunk.toString('utf8', i);
          return;
        }

        // The event name is known.
        name = buf + chunk.toString('utf8', i, sep);
        buf = '';

        // Continue past the event name.
        i = sep + 1;
        len -= Buffer.byteLength(name) + 1;

        // There may be no event body.
        if (len === 0) {
          process.nextTick(emit, name);
          process.nextTick(emit, '*', name);

          name = '';
          continue;
        }
      }

      // The body may not finish in this chunk.
      const left = size - i;
      if (len > left) {
        buf += chunk.toString('utf8', i);
        len -= left;
        return;
      }

      // Skip the event if no listeners exist.
      if (events.listenerCount(name) || events.listenerCount('*')) {
        const body = JSON.parse(buf + chunk.toString('utf8', i, i + len - 1));

        process.nextTick(emit, name, body);
        process.nextTick(emit, '*', name, body);
      }

      i += len;
      len = 0;
      name = buf = '';
    }
  };
}
