const MESSAGE_RESULT = 0;
const MESSAGE_EVENT = 1;

const RESULT_ERROR = 0;
const RESULT_SUCCESS = 1;

function RegisterPromise(fn) {
  const sendPostMessage = self.postMessage.bind(self);

  const run = (messageId, payload) => {
    runFn(messageId, payload)
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

  const runFn = (messageId, payload) => new Promise(res => res(fn(sendEvent.bind(null, messageId), payload)));

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

  self.addEventListener('message', e => run(...e.data));
}

class TransferableResponse {
  constructor(payload, transferable) {
    this.payload = payload;
    this.transferable = transferable;
  }
}


module.exports = RegisterPromise;
module.exports.TransferableResponse = TransferableResponse;