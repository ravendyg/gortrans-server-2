'use strict';

function create(status, message, src)
{
  var err = new Error(message);
  err.status = status;
  err.__stack = [ src ];

  return err;
}

function pass(err, passingPoint)
{
  err.status = err.status || 500;
  err.message = err.message || 'server error';
  err.__stack = err.__stack ? err.__stack.concat([ passingPoint ]) : [ passingPoint ];

  return err;
}

const errServ =
{
  create, pass
};

module.exports = errServ;
