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

/**
 * get list of buses out there
 * @codes: string // concatenated codes
 */
function getListOfAvailableBuses( codes )
{
  function main( resolve, reject )
  {
    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        qs: { url: encodeURI( config.NSK_BUSES + codes ) }
      },
      ( err, httpResponse, body ) =>
      {
        getListOfAvailableBusesHandler( { err, httpResponse, body, resolve, reject } );
      }
    );
  }
  return new Promise( main );
}
module.exports.getListOfAvailableBuses = getListOfAvailableBuses;

function getListOfAvailableBusesHandler( { err, httpResponse, body, resolve, reject } )
{
  if ( err )
  {
    reject( errServ.pass( err, 'getListOfAvailableBuses request' ) );
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    reject( errServ.create( httpResponse.statusCode, 'not 200 response', 'getListOfAvailableBuses request' ) );
  }
  else
  {
    try
    {
      let data = JSON.parse( body ).markers;  // busData []

      var out =
        data
        .reduce(
          ( acc, e ) =>
          {
            let code = e.id_typetr + '-' + e.marsh + '-W-' + e.title;
            acc[code] = acc[code] ? acc[code].concat(e) : [e];
            return acc;
          },
          {}
        );

      resolve( out );
    }
    catch ( e )
    {
      reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}