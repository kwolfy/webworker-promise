const ChildProcess = require('child_process');
const path = require('path');

class Webworker {
  constructor(script) {
    this._process = ChildProcess.fork(path.join(__dirname, 'worker.js'), [script]);
    this._process.on('message', (data) => this.onmessage({data}));
  }

  postMessage(data) {
    this._process.send(data);
  }

  onmessage(data) {}

}

module.exports = Webworker;