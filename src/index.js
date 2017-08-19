const MESSAGE_RESULT = 0;
const MESSAGE_EVENT = 1;

const RESULT_ERROR = 0;
const RESULT_SUCCESS = 1;

class Worker {
  /**
   *
   * @param worker {Worker}
   */

  constructor(worker) {
    this._messageId = 1;
    this._messages = new Map();

    this._worker = worker;
    this._worker.onmessage = this._onMessage.bind(this);
  }

  /**
   * @param operationName string
   * @param data any
   * @param transferable array
   * @param onEvent function
   * @returns {Promise}
   */
  exec(operationName, data = null, transferable = [], onEvent) {
    return new Promise((res, rej) => {
      const messageId = this._messageId++;
      this._messages.set(messageId, [res, rej, onEvent]);
      this._worker.postMessage([messageId, data, operationName], transferable || []);
    });
  }

  /**
   *
   * @param data any
   * @param transferable array
   * @param onEvent function
   * @returns {Promise}
   */
  postMessage(data = null, transferable = [], onEvent) {
    return new Promise((res, rej) => {
      const messageId = this._messageId++;
      this._messages.set(messageId, [res, rej, onEvent]);
      this._worker.postMessage([messageId, data], transferable || []);
    });
  }

  _onMessage(e) {
    if(!Array.isArray(e.data))
      throw new Error(`Wrong message format'`);

    const [type, ...args] = e.data;

    if(type === MESSAGE_EVENT)
      this._onEvent(...args);
    else if(type === MESSAGE_RESULT)
      this._onResult(...args);
    else
      throw new Error(`Wrong message type '${type}'`);
  }

  _onResult(messageId, success, payload) {
    const [res, rej] = this._messages.get(messageId);
    this._messages.delete(messageId);

    return success === RESULT_SUCCESS ? res(payload) : rej(payload);
  }

  _onEvent(messageId, eventName, data) {
    const [,,onEvent] = this._messages.get(messageId);

    if(onEvent) {
      onEvent(eventName, data);
    }
  }

}

module.exports = Worker;