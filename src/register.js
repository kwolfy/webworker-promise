const TinyEmitter = require('./tiny-emitter');

const MESSAGE_RESULT = 0;
const MESSAGE_EVENT = 1;
const MESSAGE_PING = 2;

const RESULT_ERROR = 0;
const RESULT_SUCCESS = 1;

const DEFAULT_HANDLER = 'main';

function RegisterPromise(fn) {
  const handlers = {[DEFAULT_HANDLER]: fn};
  const sendPostMessage = self.postMessage.bind(self);

  const server = new class WorkerRegister extends TinyEmitter {
    emit(eventName, ...args) {
      sendPostMessage({eventName, args: args});
      return this;
    }

    emitLocally(eventName, ...args) {
      super.emit(eventName, ...args);
    }

    operation(name, handler) {
      handlers[name] = handler;
      return this;
    }
  };

  const run = (messageId, payload, handlerName) => {
    runFn(messageId, payload, handlerName)
      .then((result) => {
        if(result && result instanceof TransferableResponse) {
          sendResult(messageId, RESULT_SUCCESS, result.payload, result.transferable);
        }
        else {
          sendResult(messageId, RESULT_SUCCESS, result);
        }
      })
      .catch(e => {
        sendResult(messageId, RESULT_ERROR, {
          message: e.message,
          stack: e.stack
        });
      });
  };

  const runFn = (messageId, payload, handlerName) => new Promise((res, rej) => {
    const handler = handlers[handlerName || DEFAULT_HANDLER];
    if(!handler)
      return rej(new Error(`Not found handler for this request`));

    res(handler(payload, sendEvent.bind(null, messageId)));
  });

  const sendResult = (messageId, success, payload, transferable = []) => {
    sendPostMessage([MESSAGE_RESULT, messageId, success, payload], transferable);
  };

  const sendEvent = (messageId, eventName, payload) => {
    if(!eventName)
      throw new Error('eventName is required');

    if(typeof eventName !== 'string')
      throw new Error('eventName should be string');

    sendPostMessage([MESSAGE_EVENT, messageId, eventName, payload]);
  };

  self.addEventListener('message', ({data}) => {
    if(Array.isArray(data)) {
      run(...data);
    } else if(data && data.eventName) {
      server.emitLocally(data.eventName, ...data.args);
    }
  });

  return server;
}

class TransferableResponse {
  constructor(payload, transferable) {
    this.payload = payload;
    this.transferable = transferable;
  }
}


module.exports = RegisterPromise;
module.exports.TransferableResponse = TransferableResponse;