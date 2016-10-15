/// <reference path="../index.d.ts" />
'use strict';

import {Promise} from 'es6-promise';

const request = require('request');
const bb = require('bluebird');

import { config } from '../config';
import { errServ } from '../error';
import { db } from '../db/db';


const gortrans =
{
  getListOfRoutes, getListOfRouteCodes, getListOfAvailableBuses
};

export { gortrans };

let routes: ListMarsh [] = [];
let routesTimestamp: number = 0;
let routeCodes: string [] = [];
let routesLastRefresh: number = 0;

/**
 * get list of routes
 */
function getListOfRoutes( timestamp: number ): Promise<{routes: ListMarsh [], timestamp: number}>
{
  let out: Promise<{routes: ListMarsh [], timestamp: number}> =
    new bb( getListOfRoutesPromise.bind(this, timestamp) )
    .then(
      () =>
      {
        return timestamp >= routesTimestamp
          ? bb.resolve({routes: [], timestamp})  // up to date
          : bb.resolve({routes, timestamp: routesTimestamp})
          ;
      }
    );

  return out;
}

/**
 * get list of rout codes
 */
function getListOfRouteCodes( timestamp: number ): Promise<{routeCodes: string [], timestamp: number}>
{
  let out: Promise<{routeCodes: string [], timestamp: number}> =
    new bb( getListOfRoutesPromise.bind(this, timestamp) )
    .then(
      () =>
      {
        return timestamp >= routesTimestamp
          ? bb.resolve({routeCodes: [], timestamp})  // up to date
          : bb.resolve({routeCodes, timestamp: routesTimestamp})
          ;
      }
    );

  return out;
}

/**
 * check when route list has been updaed last time
 * if more then a day ago refresh
 * then resolve list of routes ro just their codes
 */
function getListOfRoutesPromise( timestamp: number, resolve: any )
{
  if ( routesLastRefresh + config.LIST_OF_ROUTES_REFRESH_PERIOD < Date.now() )
  { // haven't refreshed lately or at all
    request(
      {
        url: config.PROXY_URL,
        method: 'GET',
        qs: { url: encodeURI( config.NSK_ROUTES ) }
      },
      getListOfRoutesResponseHandler.bind( this, resolve )
    );
  }
  else
  {
    resolve();
  }
}

function getListOfRoutesResponseHandler(
  resolve: any, err: ExpressError, httpResponse: any, body: string ): void
{
  if ( err )
  {
    console.error( err, 'getListOfRoutes request' );
    resolve(false);
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getListOfRoutes request' );
    resolve(false);
  }
  else
  {
    try
    {
      routes = JSON.parse( body );
      routesLastRefresh = Date.now();

      routeCodes =
        routes
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

      refreshRoutesInDb( JSON.stringify(routes), routesLastRefresh, resolve );
    }
    catch ( e )
    {
      console.error( e, 'getListOfRoutes parsing response' );
      resolve(false);
    }
  }
}

/**
 * get list of routes from DB
 * compare them
 * if changed replace
 */
function refreshRoutesInDb( newRoutes: string, timestamp: number, resolve: any )
{
  db.getRoutes(0)
  .then(
    (routes: string) =>
    {
      if ( routes !== newRoutes )
      {
        routesTimestamp = timestamp;
        resolve(true);
        db.putRoutes( newRoutes, timestamp );
      }
    }
  );
}

/**
 * get list of buses out there
 * @codes: string // concatenated codes
 */
function getListOfAvailableBuses( codes: string ): Promise<indexedBusData>
{
  return new bb( getListOfAvailableBusesPromise.bind( this, codes ) );
}

function getListOfAvailableBusesPromise( codes: string, resolve: any, reject: any )
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

function getListOfAvailableBusesHandler(
  resolve: any, reject: any,
  err: ExpressError, httpResponse: any, body: string): void
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
