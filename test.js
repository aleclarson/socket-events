const tp = require('testpass');

const se = require('.');

tp.group('encode:', () => {
  tp.test('no body', (t) => {
    t.eq(se.encode('foo'), '4;foo;');
  });
  tp.test('with body', (t) => {
    t.eq(se.encode('foo', {}), '7;foo;{};');
  });
});

tp.group('decode:', () => {
  tp.test('no body', (t) => {
    const spy1 = t.spy();
    const spy2 = t.spy();
    const decode = se.decoder({
      'foo': [function(data) {
        t.eq(arguments.length, 0);
        t.eq(data, undefined);
        t.eq(spy2.calls, 0);
        spy1();
      }],
      '*': [function(name, data) {
        t.eq(arguments.length, 1);
        t.eq(name, 'foo');
        t.eq(data, undefined);
        t.eq(spy1.calls, 1);
        spy2();
      }]
    });

    decode('4;foo;');

    t.async();
    t.spies(t.done);
  });
  tp.test('with body', (t) => {
    const spy1 = t.spy();
    const spy2 = t.spy();
    const decode = se.decoder({
      'foo': [function(data) {
        t.eq(arguments.length, 1);
        t.eq(data, 0);
        t.eq(spy2.calls, 0);
        spy1();
      }],
      '*': [function(name, data) {
        t.eq(arguments.length, 2);
        t.eq(name, 'foo');
        t.eq(data, 0);
        t.eq(spy1.calls, 1);
        spy2();
      }]
    });

    decode('6;foo;0;');

    t.async();
    t.spies(t.done);
  });
  tp.test('two events', (t) => {
    const calls = [];
    const decode = se.decoder({
      'foo': [function(data) {
        calls.push(data);
        if (calls.length == 2) {
          t.eq(calls, [0, 1]);
          t.done();
        }
      }]
    });

    decode('6;foo;0;6;foo;1;');
    t.async();
  });
  tp.test('body in two chunks', (t) => {
    const decode = se.decoder({
      'foo': [function(data) {
        t.eq(data, 12345);
        t.done();
      }]
    });

    const msg = '10;foo;12345;';
    decode(msg.slice(0, 10));
    decode(msg.slice(10));
    t.async();
  });
  tp.test('body in three chunks', (t) => {
    const decode = se.decoder({
      'foo': [function(data) {
        t.eq(data, 123456);
        t.done();
      }]
    });

    const msg = '11;foo;123456;';
    decode(msg.slice(0, 9));
    decode(msg.slice(9, 11));
    decode(msg.slice(11));
    t.async();
  });
  tp.test('name in two chunks', (t) => {
    const decode = se.decoder({
      'foobar': [function(data) {
        t.eq(data, 1);
        t.done();
      }]
    });

    const msg = '9;foobar;1;';
    decode(msg.slice(0, 5));
    decode(msg.slice(5));
    t.async();
  });
  tp.test('length in two chunks', (t) => {
    const decode = se.decoder({
      'foo': [function(data) {
        t.eq(data, 12345);
        t.done();
      }]
    });

    const msg = '10;foo;12345;';
    decode(msg.slice(0, 1));
    decode(msg.slice(1));
    t.async();
  });
});

tp.group('unhandled event:', () => {
  tp.test('no body', (t) => {
    se.decoder({})('4;foo;');
  });
  tp.test('with body', (t) => {
    se.decoder({})('8;foo;123;');
  });
});

tp.test('multi-byte characters', (t) => {
  const name = 'föö';
  const body = 'žžžžž';
  const decode = se.decoder({
    [name]: [function(data) {
      t.eq(data, body);
      t.done();
    }]
  });

  decode(se.encode(name, body));
  t.async();
});
