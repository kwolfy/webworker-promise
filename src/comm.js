const TinyEmitter = require('./tiny-emitter');

const MESSAGE_RESULT = 0;
const MESSAGE_EVENT = 1;

const RESULT_ERROR = 0;
const RESULT_SUCCESS = 1;

const DEFAULT_HANDLER = 'main';

class TransferableResponse {
    constructor(payload, transferable) {
      this.payload = payload;
      this.transferable = transferable;
    }
}

const isPromise = o => typeof o === 'object' && o !== null && typeof o.then === 'function' && typeof o.catch === 'function';

class Communicator extends TinyEmitter {
    
    constructor(messagePort, defaultHandler) {
        super()
        this._messageId = 1;
        this._messagePort = messagePort
        this._handlers = {[DEFAULT_HANDLER]: defaultHandler};
        this._outgoing = new Map()
        this._incoming = new Map()
    }

    /**
     * return true if there is no unresolved jobs
     * @returns {boolean}
     */
    isFree() {
        return this._outgoing.size === 0;
    }

    jobsLength() {
        return this._outgoing.size;
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
            this._outgoing.set(messageId, [res, rej, onEvent]);
            this._messagePort.postMessage([messageId, data, operationName], transferable || []);
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
            this._outgoing.set(messageId, [res, rej, onEvent]);
            this._messagePort.postMessage([messageId, data], transferable || []);
        });
    }

    emit(eventName, ...args) {
        if (args.length == 1 && args[0] instanceof TransferableResponse) {
            this._messagePort.postMessage({eventName, args}, args[0].transferable);
        } else {
            this._messagePort.postMessage({eventName, args});
        }
        return this;
    }

    emitLocally(eventName, ...args) {
        super.emit(eventName, ...args);
    }

    operation(name, handler) {
        this._handlers[name] = handler;
        return this;
    }

    _onRun(messageId, payload, handlerName) {

        const runFn = (messageId, payload, handlerName) =>  {
            const handler = this._handlers[handlerName || DEFAULT_HANDLER];
            if(!handler)
            throw new Error(`Not found handler for this request`);

            return handler(payload, sendEvent.bind(null, messageId))
        };

        const sendResult = (messageId, success, payload, transferable = []) => {
            this._messagePort.postMessage([MESSAGE_RESULT, messageId, success, payload], transferable);
        };

        const sendEvent = (messageId, eventName, payload) => {
            if(!eventName)
            throw new Error('eventName is required');

            if(typeof eventName !== 'string')
            throw new Error('eventName should be string');

            this._messagePort.postMessage([MESSAGE_EVENT, messageId, eventName, payload]);
        };

        const onSuccess = (result) => {
            if(result && result instanceof TransferableResponse) {
                sendResult(messageId, RESULT_SUCCESS, result.payload, result.transferable);
            }
            else {
                sendResult(messageId, RESULT_SUCCESS, result);
            }
        };

        const onError = (e) => {
            sendResult(messageId, RESULT_ERROR, {
                message: e.message,
                stack: e.stack
            });
        };

        try {
            const result = runFn(messageId, payload, handlerName);
            if(isPromise(result)) {
                result.then(onSuccess).catch(onError);
            } else {
                onSuccess(result);
            }
        } catch (e) {
            onError(e);
        }

    }

    _onMessage(data) {
        if(Array.isArray(data)) {
            if (data.length == 4) {
                // event
                this._onResponse(data)
            } else {
                // event response
                this._onRun(...data);
            }
        } else if(data && data.eventName) {
            this.emitLocally(data.eventName, ...data.args);
        }
    }

    _onResponse(e) {
        const [type, ...args] = e;

        if(type === MESSAGE_EVENT)
            this._onEvent(...args);
        else if(type === MESSAGE_RESULT)
            this._onResult(...args);
        else
            throw new Error(`Wrong message type '${type}'`);
    }

    _onResult(messageId, success, payload) {
        const [res, rej] = this._outgoing.get(messageId);
        this._outgoing.delete(messageId);

        return success === RESULT_SUCCESS ? res(payload) : rej(payload);
    }

    _onEvent(messageId, eventName, data) {
        const [,,onEvent] = this._outgoing.get(messageId);

        if(onEvent) {
            onEvent(eventName, data);
        }
    }

}

module.exports = {
    Communicator,
    TransferableResponse
}