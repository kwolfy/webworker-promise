

global.self = new class Worker {
  constructor() {
    this._listeners = [];
    process.on('message', (data) => this.onmessage({data}));
  }

  postMessage(m) {
    process.send(m);
  }

  onmessage(data) {
    for(let listener of this._listeners) {
      listener(data);
    }
  }

  addEventListener(eventName, listener) {
    if(eventName === 'message') {
      this._listeners.push(listener);
    }
  }
};

require(process.argv[2]);
