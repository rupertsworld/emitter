import mitt, { type Emitter as MittEmitter, type WildcardHandler } from 'mitt';
import type { Disposable } from '@rupertsworld/disposable';

export type { Disposable } from '@rupertsworld/disposable';

/**
 * Handler for a specific event type.
 */
type Handler<T> = (event: T) => void;

/**
 * Handler for wildcard subscriptions — receives event type and payload.
 */
type EmitterWildcardHandler<T extends Record<string, any>> = (
  type: keyof T,
  event: T[keyof T]
) => void;

/**
 * Base class that provides event emitting capabilities with disposable subscriptions.
 */
export class Emitter<T extends Record<string, any>> {
  private emitter: MittEmitter<T> = mitt<T>();

  /**
   * Subscribe to an event & return a disposable subscription.
   * Use "*" to subscribe to all events — handler receives (type, event).
   */
  on<K extends keyof T>(type: K, handler: Handler<T[K]>): Disposable;
  on(type: '*', handler: EmitterWildcardHandler<T>): Disposable;
  on<K extends keyof T | '*'>(
    type: K,
    handler: K extends '*' ? EmitterWildcardHandler<T> : Handler<T[K & keyof T]>
  ): Disposable {
    this.emitter.on(type as keyof T, handler as Handler<T[keyof T]>);
    return { dispose: () => this.emitter.off(type as keyof T, handler as Handler<T[keyof T]>) };
  }

  /**
   * Subscribe to an event once and return a disposable subscription.
   * Use "*" to subscribe to all events — handler receives (type, event).
   */
  once<K extends keyof T>(type: K, handler: Handler<T[K]>): Disposable;
  once(type: '*', handler: EmitterWildcardHandler<T>): Disposable;
  once<K extends keyof T | '*'>(
    type: K,
    handler: K extends '*' ? EmitterWildcardHandler<T> : Handler<T[K & keyof T]>
  ): Disposable {
    const wrappedHandler = (...args: [T[keyof T]] | [keyof T, T[keyof T]]) => {
      (handler as Function)(...args);
      this.emitter.off(type as keyof T, wrappedHandler as Handler<T[keyof T]>);
    };

    this.emitter.on(type as keyof T, wrappedHandler as Handler<T[keyof T]>);
    return { dispose: () => this.emitter.off(type as keyof T, wrappedHandler as Handler<T[keyof T]>) };
  }

  /**
   * Unsubscribe from an event
   */
  readonly off = this.emitter.off;

  /**
   * Emit an event
   */
  protected emit<K extends keyof T>(
    type: K,
    ...[event]: T[K] extends undefined ? [] : [T[K]]
  ): void {
    this.emitter.emit(type, event as T[K]);
  }
}
