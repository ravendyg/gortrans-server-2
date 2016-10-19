/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');

import {Promise} from 'es6-promise';
import * as bb from 'bluebird';

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
    (res: {routes: string, timestamp: number}) =>
    {
      if ( res.routes !== newRoutes )
      {
        routesTimestamp = timestamp;
        resolve(true);
        db.putRoutes( newRoutes, timestamp );
      }
      else
      {
        resolve(false);
        routesTimestamp = res.timestamp;
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
    console.error( err, 'getListOfAvailableBuses request' );
    resolve({});
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getListOfAvailableBuses request' );
    resolve({});
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


// initial load of vehicle trasses
getListOfRoutes(0)
.then(
  () =>
  {
// debug limit
routeCodes = routeCodes.filter( e => e.match(/1-036-W/) || e.match(/1-045-W/) );

    routeCodes.reduce(
      ( acc: Promise<any>, busCode: string ) =>
      {
        return new bb(
          (resolve: any) =>
          { // check whether it's in the db
            db.getTrass( 0, busCode )
            .then(
              (val: {trass: string, timestamp: number}) =>
              {
                let timestamp = Date.now();
                if ( val.timestamp + config.TRASS_DATA_VALID_FOR > timestamp )
                { // relatively fresh
                  resolve();
                }
                else
                { // expired, reload for check
                  getVehicleTrass(resolve, busCode, val.trass, timestamp);
                }
              }
            )
            .catch( () => resolve() );
          }
        );
      },
      Promise.resolve()
    );
  }
);


function getVehicleTrass(resolve: any, busCode: string, trass: string, timestamp: number)
{
  request(
    {
      url: config.PROXY_URL + busCode,
      method: 'GET',
      qs: { url: encodeURI( config.NSK_TRASSES ) }
    },
    getVehicleTrassResponseHandler.bind(this, resolve, trass, busCode, timestamp)
  );
}

function getVehicleTrassResponseHandler(
  resolve: any, trass: string, busCode: string, timestamp: number,
  err: Error, httpResponse: any, body: string
)
{
  if ( err )
  {
    console.error( err, 'getVehicleTrass request' );
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getVehicleTrass request' );
  }
  else
  {
    if ( body !== trass )
    { // smth changed
      db.putTrasses(body, busCode, timestamp);
    }
  }
  resolve();
}