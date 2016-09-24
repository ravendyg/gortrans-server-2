/// <reference path="../lib/index.d.ts" />
'use strict';

function create( status: number, message: string, src: string ): ExpressError {
  var err = <ExpressError> new Error( message );
  err.status = status;
  err.__stack = [ src ];

  return err;
}

function pass( err: ExpressError, passingPoint: string ): ExpressError {
  err.status = err.status || 500;
  err.message = err.message || 'server error';
  err.__stack = err.__stack ? err.__stack.concat([ passingPoint ]) : [ passingPoint ];

  return err;
}

const errServ: any =
{
  create, pass
};

export { errServ };