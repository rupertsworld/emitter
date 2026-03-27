import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Emitter } from '../src/index.js';

type TestEvents = {
  foo: string;
  bar: number;
  empty: undefined;
};

class TestEmitter extends Emitter<TestEvents> {
  emitFoo(value: string) {
    this.emit('foo', value);
  }
  emitBar(value: number) {
    this.emit('bar', value);
  }
  emitEmpty() {
    this.emit('empty');
  }
}

describe('Emitter', () => {
  describe('on() - specific event', () => {
    it('receives the event payload', () => {
      const emitter = new TestEmitter();
      const received: string[] = [];

      emitter.on('foo', (event) => {
        received.push(event);
      });

      emitter.emitFoo('hello');
      emitter.emitFoo('world');

      assert.deepStrictEqual(received, ['hello', 'world']);
    });

    it('returns a disposable that unsubscribes', () => {
      const emitter = new TestEmitter();
      const received: string[] = [];

      const sub = emitter.on('foo', (event) => {
        received.push(event);
      });

      emitter.emitFoo('before');
      sub.dispose();
      emitter.emitFoo('after');

      assert.deepStrictEqual(received, ['before']);
    });
  });

  describe('on("*") - wildcard', () => {
    it('receives (type, event) for all events', () => {
      const emitter = new TestEmitter();
      const received: Array<{ type: keyof TestEvents; event: any }> = [];

      emitter.on('*', (type, event) => {
        received.push({ type, event });
      });

      emitter.emitFoo('hello');
      emitter.emitBar(42);
      emitter.emitEmpty();

      assert.deepStrictEqual(received, [
        { type: 'foo', event: 'hello' },
        { type: 'bar', event: 42 },
        { type: 'empty', event: undefined },
      ]);
    });

    it('returns a disposable that unsubscribes', () => {
      const emitter = new TestEmitter();
      const received: Array<{ type: keyof TestEvents; event: any }> = [];

      const sub = emitter.on('*', (type, event) => {
        received.push({ type, event });
      });

      emitter.emitFoo('before');
      sub.dispose();
      emitter.emitFoo('after');

      assert.deepStrictEqual(received, [{ type: 'foo', event: 'before' }]);
    });
  });

  describe('once() - specific event', () => {
    it('fires only once', () => {
      const emitter = new TestEmitter();
      const received: string[] = [];

      emitter.once('foo', (event) => {
        received.push(event);
      });

      emitter.emitFoo('first');
      emitter.emitFoo('second');

      assert.deepStrictEqual(received, ['first']);
    });

    it('can be disposed before firing', () => {
      const emitter = new TestEmitter();
      const received: string[] = [];

      const sub = emitter.once('foo', (event) => {
        received.push(event);
      });

      sub.dispose();
      emitter.emitFoo('never');

      assert.deepStrictEqual(received, []);
    });
  });

  describe('once("*") - wildcard', () => {
    it('fires only once with (type, event)', () => {
      const emitter = new TestEmitter();
      const received: Array<{ type: keyof TestEvents; event: any }> = [];

      emitter.once('*', (type, event) => {
        received.push({ type, event });
      });

      emitter.emitFoo('first');
      emitter.emitBar(42);

      assert.deepStrictEqual(received, [{ type: 'foo', event: 'first' }]);
    });
  });

  describe('events with undefined payload', () => {
    it('can emit and receive events with no payload', () => {
      const emitter = new TestEmitter();
      let called = false;

      emitter.on('empty', () => {
        called = true;
      });

      emitter.emitEmpty();

      assert.strictEqual(called, true);
    });
  });
});
