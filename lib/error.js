/// <reference path="../lib/index.d.ts" />
'use strict';

function create ( status, message, src )
{
  var err = new Error( message );
  err.status = status;
  err.__stack = [ src ];

  return err;
}
module.exports.create = create;


function pass ( err, passingPoint )
{
  err.status = err.status || 500;
  err.message = err.message || 500;
  err.__stack = err.__stack ? err.__stack.concat([ passingPoint ]) : [ passingPoint ];

  return err;
}
module.exports.pass = pass;