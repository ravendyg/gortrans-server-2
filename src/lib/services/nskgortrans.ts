/// <reference path="../index.d.ts" />
'use strict';

const request = require('request');

import * as Bluebird from 'bluebird';

import { config } from '../config';
import { errServ } from '../error';
import { db } from '../db/db';

const gortrans =
{
  getListOfRoutes, getListOfRouteCodes, getListOfAvailableBuses, getStops
};

export { gortrans };

let routes: ListMarsh [] = [];
let routesTimestamp: number = 0;
let routeCodes: string [] = [];
let routesLastRefresh: number = 0;


let stops: { [stopId: string]: Stop } = {};
let busStops: BusStops = {};
let stopsTimestamp: number = 0;

/**
 * get list of routes
 */
function getListOfRoutes( timestamp: number ): Bluebird<{routes: ListMarsh [], timestamp: number}>
{
  let out: Bluebird<{routes: ListMarsh [], timestamp: number}> =
    new Bluebird( getListOfRoutesPromise.bind(this, timestamp) )
    .then(
      () =>
      {
        return timestamp >= routesTimestamp
          ? Bluebird.resolve({routes: [], timestamp})  // up to date
          : Bluebird.resolve({routes, timestamp: routesTimestamp})
          ;
      }
    );

  return out;
}

/**
 * get list of rout codes
 */
function getListOfRouteCodes( timestamp: number ): Bluebird<{routeCodes: string [], timestamp: number}>
{
  let out: Bluebird<{routeCodes: string [], timestamp: number}> =
    new Bluebird( getListOfRoutesPromise.bind(this, timestamp) )
    .then(
      () =>
      {
        return timestamp >= routesTimestamp
          ? Bluebird.resolve({routeCodes: [], timestamp})  // up to date
          : Bluebird.resolve({routeCodes, timestamp: routesTimestamp})
          ;
      }
    );

  return out;
}

/**
 * check when route list has been updated last time
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
        try
        {
          var temp = JSON.parse(newRoutes);
          routesTimestamp = timestamp;
          resolve(true);
          db.putRoutes( newRoutes, timestamp );
        }
        catch (err)
        {
          resolve(false);
        }
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
function getListOfAvailableBuses( codes: string ): Bluebird<indexedBusData>
{
  return new Bluebird( getListOfAvailableBusesPromise.bind( this, codes ) ) as Bluebird<indexedBusData>;
}

function getListOfAvailableBusesPromise( codes: string, resolve: (res: indexedBusData) => void, reject: (err: any) => void )
{
  request(
    {
      url: config.PROXY_URL,
      method: 'GET',
      qs: { url: encodeURI( config.NSK_BUSES + codes ) }
    },
    getListOfAvailableBusesHandler.bind( this, resolve, reject, codes )
  );
}

function getListOfAvailableBusesHandler(
  resolve: (res: indexedBusData) => indexedBusData, reject: (err: any) => any, codesQuery: string,
  err: ExpressError, httpResponse: any, body: string): void
{
  if ( err )
  {
    console.error( err, 'getListOfAvailableBuses request' );
    resolve(<indexedBusData>{});
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getListOfAvailableBuses request' );
    resolve(<indexedBusData>{});
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

      let codes = codesQuery.split('|');
      for ( let code of codes )
      { // in case there were no markers for this bus
        if ( !out[code] )
        {
          out[code] = [];
        }
      }

      resolve( out );
    }
    catch ( e )
    {
      reject( errServ.pass( e, 'getListOfRoutes parsing response' ) );
    }
  }
}


// initial load of vehicle trasses
Bluebird.all([
  getListOfRoutes(0),
  loadStopsFromDb()
])
.then(
  () =>
  {
    // remove buses we are not interested in
    routeCodes = routeCodes.filter( config.FILTER_BUSES_OUT );

    routeCodes.reduce(
      ( acc: Bluebird<any>, busCode: string ) =>
      {
        return acc.then(
          (trassNotChanged: boolean) =>
          {
            return new Bluebird(
              (resolve: any) =>
              { // check whether it's in the db
                db.getTrass( 0, busCode )
                .then(
                  (val: {trass: string, timestamp: number}) =>
                  {
                    let timestamp = Date.now();
                    if ( val.timestamp + config.TRASS_DATA_VALID_FOR > timestamp )
                    { // relatively fresh
                      resolve(trassNotChanged && true);
                    }
                    else
                    { // expired, reload for check
                      getVehicleTrass(resolve, busCode, val.trass, timestamp, trassNotChanged);
                    }
                  }
                );
              }
            );
          }
        );
      },
      Bluebird.resolve(true)
    )
    .then(
      (trassNotChanged: boolean) =>
      {
        if ( !trassNotChanged )
        {
          db.putStopsInDb(stops, busStops, stopsTimestamp);
        }
        return Bluebird.resolve();
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, 'initial load of vehicle trasses');
      }
    );
  }
);


function getVehicleTrass(
  resolve: any, busCode: string, trass: string,
  timestamp: number, trassNotChanged: boolean
)
{
  request(
    {
      url: config.PROXY_URL,
      method: 'GET',
      qs: { url: encodeURI( config.NSK_TRASSES + busCode ) }
    },
    getVehicleTrassResponseHandler
    .bind(this, resolve, trass, busCode, timestamp, trassNotChanged)
  );
}

function getVehicleTrassResponseHandler(
  resolve: any, trass: string, busCode: string, timestamp: number, trassNotChanged: boolean,
  err: Error, httpResponse: any, body: string
): void
{
  if ( err )
  {
    console.error( err, 'getVehicleTrass request' );
    resolve(trassNotChanged && true);
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getVehicleTrass request' );
    resolve(trassNotChanged && true);
  }
  else
  {
    if ( body !== trass )
    { // smth changed
      try
      { // check that data are valid JSON
        var temp = JSON.parse(body);
        db.putTrasses(body, busCode, timestamp);
        extractStopsFromTrass(body, busCode);
        resolve(trassNotChanged && false);
      }
      catch (err)
      {
        resolve(trassNotChanged && true);
      }
    }
    else
    {
      resolve(trassNotChanged && true);
    }
  }
}

/**
 * extract stops from a bus trass
 */
function extractStopsFromTrass(body: string, busCode: string): void
{
  try
  {
    let points: any [] = JSON.parse(body).trasses[0].r[0].u;
    points = points.filter(filterStops);
    for ( let point of points )
    {
      if ( !stops[point.id] )
      {
        stops[point.id] =
        {
          id: point.id,
          n: point.n,
          lat: point.lat,
          lng: point.lng,
          vehicles: {}
        };
      }
      stops[point.id].vehicles[busCode] = true;

      if ( !busStops[busCode] )
      {
        busStops[busCode] = {};
      }
      busStops[busCode][point.id] = true;
    }
    stopsTimestamp = Date.now();
  }
  catch (err)
  {
    console.error(err, extractStopsFromTrass);
  };
}

function filterStops(e: any)
{
  return e['id'];
}

function loadStopsFromDb(): Bluebird<boolean>
{
  function main(resolve: (res: any) => boolean)
  {
    db.getStops()
    .then(
      ({stopsDb, busStopsDb, timestamp}:
        {stopsDb: { [stopId: string]: Stop }, busStopsDb: BusStops, timestamp: number}
      ) =>
      {
        stops = stopsDb;
        busStops = busStopsDb;
        stopsTimestamp = timestamp;
        resolve(true);
      }
    )
    .catch(
      (err: Error) =>
      {
        console.error(err, 'loadStopsFromDb');
        stops = {};
        busStops = {};
        stopsTimestamp = 0;
        resolve(true);
      }
    );
  }
  return new Bluebird( main );
}

function getStops(timestamp: number):
Bluebird<{stops: { [stopId: string]: Stop }, busStops: BusStops, timestamp: number}>
{
  if (timestamp < stopsTimestamp)
  {
    return Bluebird.resolve(
      {stops, busStops, timestamp: stopsTimestamp}
    );
  }
  else
  {
    return Bluebird.resolve(
      {stops: {}, busStops: {}, timestamp}
    );
  }
}