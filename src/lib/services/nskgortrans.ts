/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');
const Promise = require('bluebird');

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
  return new Promise( getListOfRoutesPromise );
}

function getListOfRoutesPromise( resolve: any, reject: any )
{
  request(
    {
      url: config.PROXY_URL,
      method: 'GET',
      qs: { url: encodeURI( config.NSK_ROUTES ) }
    },
    getListOfRoutesResponseHandler.bind( this, resolve, reject )
  );
}

function getListOfRoutesResponseHandler( resolve: any, reject: any, err: ExpressError, httpResponse: any, body: string ): any
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
      let data = JSON.parse( body );
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
function getListOfAvailableBuses( codes: string [] )
{
  return new Promise( getListOfAvailableBusesPromise.bind( this, codes ) );
}

function getListOfAvailableBusesPromise( codes: string [], resolve: any, reject: any )
{
  request(
    {
      url: config.PROXY_URL,
      method: 'GET',
      qs: { url: encodeURI( config.NSK_BUSES + codes ) }
    },
    getListOfAvailableBusesHandler.bind( this, resolve, reject )
  );
}

function getListOfAvailableBusesHandler( resolve: any, reject: any, err: ExpressError, httpResponse: any, body: string): void
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
      let data: busData [] = JSON.parse( body ).markers;

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

      resolve( out );
    }
    catch ( e )
    {
      reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}
