'use strict';
const isReadable = require('is-stream').readable;
const isWritable = require('is-stream').writable;

const se = exports;

se.reader = function(stream) {
  if (isReadable(stream)) {
    const listeners = Object.create(null);
    stream.on('data', decoder(listeners));

    const listen = function(name, fn) {
      if (arguments.length === 1) {
        fn = name; name = '*';
      }
      const list = listeners[name];
      if (list) list.push(fn);
      else listeners[name] = [fn];
    };

    listen.off = function(name, fn) {
      if (arguments.length === 0) {
        for (name in listeners) {
          delete listeners[name];
        }
      } else {
        if (typeof name === 'function') {
          fn = name; name = '*';
        }
        const list = listeners[name];
        if (!list) return;
        if (!fn || list.length === 1) {
          delete listeners[name];
        } else {
          const i = list.indexOf(fn);
          if (i !== -1) list.splice(i, 1);
        }
      }
    };

    return listen;
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
function decoder(listeners) {
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
          let list = listeners[name];
          if (list) process.nextTick(emit, list);

          list = listeners['*'];
          if (list) process.nextTick(emit, list, name);

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
      let list = listeners[name] || listeners['*'];
      if (list !== undefined) {
        const body = JSON.parse(buf + chunk.toString('utf8', i, i + len - 1));

        list = listeners[name];
        if (list) process.nextTick(emit, list, body);

        list = listeners['*'];
        if (list) process.nextTick(emit, list, name, body);
      }

      i += len;
      len = 0;
      name = buf = '';
    }
  };
}

function emit(list, $1, $2) {
  let i = 0, len = list.length;
  switch (arguments.length) {
    case 1:
      for (; i < len; i++) list[i]();
      break;
    case 2:
      for (; i < len; i++) list[i]($1);
      break;
    case 3:
      for (; i < len; i++) list[i]($1, $2);
      break;
  }
}
