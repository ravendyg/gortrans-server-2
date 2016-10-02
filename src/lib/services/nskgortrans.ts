/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');
const Promise = require('bluebird');

import { config } from '../config';
import { errServ } from '../error';
import { db } from '../db/db';

const gortrans: any =
{
  getListOfRoutes, getListOfRouteCodes, getListOfAvailableBuses
};

export { gortrans };


let listOfRoutes: ListMarsh [];
let routeCodes: string [];
let listOfRoutesLastRefresh: number = 0;

/**
 * get list of routes
 */
function getListOfRoutes( timestamp: number )
{
  return db.getRoutes( timestamp );
}

/**
 * get list of rout codes
 */
function getListOfRouteCodes()
{
  return new Promise( getListOfRoutesPromise );
}

/**
 * check when route list has been updaed last time
 * if more then a day ago refresh
 * then resolve list of routes ro just their codes
 */
function getListOfRoutesPromise( resolve: any, reject: any )
{
  if ( listOfRoutesLastRefresh + config.LIST_OF_ROUTES_REFRESH_PERIOD < Date.now() )
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
  else
  {
    resolve( listOfRoutes );
  }
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
      listOfRoutes = JSON.parse( body );
      listOfRoutesLastRefresh = Date.now();

      routeCodes =
        listOfRoutes
        .reduce(
          ( acc: string [], route: ListMarsh ) => {
            var codes =
              route.ways.reduce(
                ( acc2: string [], way: Way ) => {
                  var out =
                    acc2.concat(
                      ((+route.type) + 1) + '-' + way.marsh + '-W-' + way.name
                    );
                  return out;
                },
                []
              );
            return acc.concat( codes );
          },
          []
        );
      resolve( routeCodes );

      refreshRoutesInDb( JSON.stringify(listOfRoutes), listOfRoutesLastRefresh );
    }
    catch ( e )
    {
      reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}

/**
 * get list of routes from DB
 * compare them
 * if changed replace
 */
function refreshRoutesInDb( newRoutes: string, timestamp: number )
{
  getListOfRoutes( 0 )
  .then(
    (routes: string) =>
    {
      if ( routes !== newRoutes )
      {
        db.putRoutes( newRoutes, timestamp );
      }
    }
  );
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
