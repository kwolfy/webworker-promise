export = registerWebworker;

/**
 * Register operations and events in the webworker that are callable from the main thread.
 *
 * @param register Event handler for `postMessage` calls from the main thread.
 *
 * @example
 *
 * ```
 * // worker.js
 * registerWebworker((message) => {
 *      return `Hello ${message}!`;
 * });
 *
 * // main.js
 * worker.postMessage('world').then((response) => {
 *      console.log(response); // Hello world!
 * })
 * ```
 */
declare function registerWebworker(
  register?: (message: any, emit: (eventName: string, data: any) => void) => any
): registerWebworker.WorkerHost;

declare namespace registerWebworker {
  /**
   * Webworker side API for registering operations and events that can be called from the main thread.
   */
  interface WorkerHost {
    /**
     * Register an operation that can be triggered via the `exec` command from the main thread.
     * The emit function is scoped to the event handler of the `exec` operation and does not trigger the global `on` / `once` handlers in the main thread.
     *
     * @param eventName Name of the operation
     * @param handler Event handler
     *
     * @example
     *
     * ```
     * // worker.js
     * registerWebworker().operation('greet', (message) => {
     *      return `Hello ${message}!`;
     * });
     *
     * // main.js
     * worker.exec('greet', 'world').then((response) => {
     *      console.log(response); // Hello world!
     * })
     * ```
     */
    operation(
      eventName: string,
      handler: (
        message: any,
        emit: (eventName: string, data: any) => void
      ) => any
    ): WorkerHost;
    /**
     * Register an event handler that can be triggered via the `emit` command from the main thread.
     *
     * @param eventName Name of the operation
     * @param handler Event handler
     *
     * @example
     *
     * ```
     * // worker.js
     * const host = registerWebworker()
     *  .on('add', (x, y) => {
     *      host.emit('add:result', x + y);
     *  });
     *
     * // main.js
     * worker.on('add:result', (result) => {
     *      console.log(result); // 3
     * });
     *
     * worker.emit('add', 1, 2);
     * ```
     */
    on(eventName: string, handler: (...args: any[]) => void): WorkerHost;
    /**
     * Register an event handler that can be triggered via the `emit` command from the main thread, will only be triggered once.
     *
     * @param eventName Name of the operation
     * @param handler Event handler
     *
     * @example
     *
     * ```
     * // worker.js
     * const host = registerWebworker()
     *  .once('add', (x, y) => {
     *      host.emit('add:result', x + y);
     *  });
     *
     * // main.js
     * worker.once('add:result', (result) => {
     *      console.log(result); // 3
     * });
     *
     * // Will only have effect first call
     * worker.emit('add', 1, 2);
     * ```
     */
    once(eventName: string, handler: (...args: any[]) => void): WorkerHost;
    /**
     * Emit a value to the main thread that can be listened to via the `on` and `once` methods.
     *
     * @param eventName Name of the event
     * @param args Values to emit
     *
     * @example
     *
     * ```
     * // worker.js
     * const host = registerWebworker()
     *  .on('add', (x, y) => {
     *      host.emit('add:result', x + y);
     *  });
     *
     * // main.js
     * worker.on('add:result', (result) => {
     *      console.log(result); // 3
     * });
     *
     * worker.emit('add', 1, 2);
     * ```
     */
    emit(eventName: string, ...args: any[]): void;
  }

  /**
   * Use to return transferables from worker thread to main thread.
   *
   * @example
   *
   * ```
   *  const arrayBuffer = new ArrayBuffer(10);
   *
   *  // worker.js
   *  registerWebworker((message) => {
   *      return new registerWebworker.TransferableResponse(arrayBuffer, [arrayBuffer]);
   *  });
   * ```
   */
  class TransferableResponse {
    constructor(response: any, tranferables: Transferable[]);
  }
}
