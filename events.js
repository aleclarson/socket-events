'use strict';

// Feather-weight event emitter.
function EventEmitter(events) {
  this._events = events || Object.create(null);

  // Let `events` have function values.
  for (let event in this._events) {
    const list = events[event];
    if (typeof list == 'function') {
      events[event] = [list];
    }
  }
}

module.exports = EventEmitter;

Object.assign(EventEmitter.prototype, {
  emit(name, $1, $2) {
    if (typeof name !== 'string' || name === '') {
      throw Error('Invalid event name: ' + (JSON.stringify(name) || String(name)));
    }
    const list = this._events[name];
    if (!list) return false;
    switch (arguments.length) {
      case 1: emit(list); break;
      case 2: emit(list, $1); break;
      case 3: emit(list, $1, $2); break;
    }
    return true;
  },
  listenerCount(name) {
    const list = this._events[name];
    return list ? list.length : 0;
  },
  on(name, fn) {
    if (arguments.length == 1) {
      fn = name; name = '*';
    }
    const list = this._events[name];
    if (list) list.push(fn);
    else this._events[name] = [fn];
    return fn;
  },
  off(name, fn) {
    if (arguments.length == 1) {
      fn = name; name = '*';
    }
    const list = this._events[name];
    if (!list) return;
    if (list.length !== 1) {
      const i = list.indexOf(fn);
      if (i == -1) list.splice(i, 1);
    } else if (list[0] == fn) {
      delete this._events[name];
    }
  },
  clear(name) {
    if (arguments.length === 0) {
      this._events = Object.create(null);
    } else {
      delete this._events[name];
    }
  }
});

function emit(list, $1, $2) {
  let i = 0, len = typeof list == 'object' ? list.length : 0;
  switch (arguments.length) {
    case 1:
      if (len == 0) return list();
      for (; i < len; i++) list[i]();
      break;
    case 2:
      if (len == 0) return list($1);
      for (; i < len; i++) list[i]($1);
      break;
    case 3:
      if (len == 0) return list($1, $2);
      for (; i < len; i++) list[i]($1, $2);
      break;
  }
}
