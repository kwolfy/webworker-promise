const { Communicator } = require('./comm');

class Worker extends Communicator {
  /**
   *
   * @param worker {Worker}
   */
  constructor(worker) {
    super(worker);

    worker.onmessage = ({data}) => this._onMessage(data);
    this._id = Math.ceil(Math.random() * 10000000);
  }

  terminate() {
    this._messagePort.terminate();
  }

}

module.exports = Worker;
