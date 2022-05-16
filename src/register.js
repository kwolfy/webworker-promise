const { Communicator, TransferableResponse } = require('./comm');

function RegisterPromise(fn, scope) {

  if (!scope) scope = self

  const server = new Communicator(scope, fn)

  scope.addEventListener('message', ({data}) => {
    server._onMessage(data)
  });

  if (scope.start) {
    scope.start()
  }

  return server;
}

module.exports = RegisterPromise;
module.exports.TransferableResponse = TransferableResponse;