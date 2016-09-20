/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');

const config = require('../config');
const errServ = require('../error');

/**
 * get list of routes
 */
function getListOfRoutes()
{
  function main( resolve, reject )
  {
    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        qs: { url: encodeURI( config.NSK_ROUTES ) }
      },
      ( err, httpResponse, body ) =>
      {
        getListOfRoutesResponseHandler( { err, httpResponse, body, resolve, reject } );
      }
    );
  }
  return new Promise( main );
}
module.exports.getListOfRoutes = getListOfRoutes;

function getListOfRoutesResponseHandler( { err, httpResponse, body, resolve, reject } )
{
  if ( err )
  {
    reject( errServ.pass( err, 'getListOfRoutes request' ) );
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    reject( errServ.create( httpResponse.statusCode, 'not 200 response', 'getListOfRoutes request' ) );
  }
  else
  {
    try
    {
      let data;

      data = JSON.parse( body );
      resolve( data );
    }
    catch ( e )
    {
      reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}
