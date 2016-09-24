/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');

import { config } from '../config';
import { errServ } from '../error';

const gortrans: any =
{
  getListOfRoutes, getListOfAvailableBuses
};

export { gortrans };

/**
 * get list of routes
 */
function getListOfRoutes()
{
  function main( resolve: any, reject: any )
  {
    let self: PromiseSelf = { resolve, reject };

    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        qs: { url: encodeURI( config.NSK_ROUTES ) }
      },
      getListOfRoutesResponseHandler.bind( self )
    );
  }
  return new Promise( main );
}

function getListOfRoutesResponseHandler( err: ExpressError, httpResponse: any, body: string): any
{
  if ( err )
  {
    this.reject( errServ.pass( err, 'getListOfRoutes request' ) );
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    this.reject( errServ.create( httpResponse.statusCode, 'not 200 response', 'getListOfRoutes request' ) );
  }
  else
  {
    try
    {
      let data = JSON.parse( body );
      this.resolve( data );
    }
    catch ( e )
    {
      this.reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}

/**
 * get list of buses out there
 * @codes: string // concatenated codes
 */
function getListOfAvailableBuses( codes: string [] )
{
  function main( resolve: any, reject: any )
  {
    let self: PromiseSelf = { resolve, reject };

    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        qs: { url: encodeURI( config.NSK_BUSES + codes ) }
      },
      getListOfAvailableBusesHandler.bind( self )
    );
  }
  return new Promise( main );
}

function getListOfAvailableBusesHandler( err: ExpressError, httpResponse: any, body: string): void
{
  if ( err )
  {
    this.reject( errServ.pass( err, 'getListOfAvailableBuses request' ) );
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    this.reject( errServ.create( httpResponse.statusCode, 'not 200 response', 'getListOfAvailableBuses request' ) );
  }
  else
  {
    try
    {
      let data = JSON.parse( body ).markers;  // busData []

      var out =
        data
        .reduce(
          ( acc: indexedBusData, e: busData ) =>
          {
            let code = e.id_typetr + '-' + e.marsh + '-W-' + e.title;
            acc[code] = acc[code] ? acc[code].concat(e) : [e];
            return acc;
          },
          {}
        );

      this.resolve( out );
    }
    catch ( e )
    {
      this.reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}
