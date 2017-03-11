'use strict';

const request = require('request');
const Bluebird = require('bluebird');

const models = require('../db/models');

const config = require('../config');

module.exports =
{
  getListOfAvailableBuses, getTrass
};


let state =
{
  name: 'info',
  updated: 0,
  routes: [],
  routeCodes: [],
  routestimestamp: 0,
  trasses: {},
  trassestimestamp: 0,
  stops: {},
  busStops: {}
};
module.exports.getState = () => state;


models.Info.findOne({name: 'info'},
  (err, info) =>
  {
    // initial state reload
    if (info)
    {
      state.updated = info.updated;
      state.routes = info.routes;
      state.routeCodes = info.routeCodes;
      state.routestimestamp = info.routestimestamp;
      state.trasses = info.trasses;
      state.trassestimestamp = info.trassestimestamp;
      state.stops = info.stops;
      state.busStops = info.busStops;
    }

    let date = new Date();
    let now = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();

    if (info.updated < now)
    { // old data
      syncWithRu();
    }
    else
    {
      let nextDate = new Date(date.getTime() + 1000 * 60 * 60 * 24);
      let next = Date.parse(nextDate.getFullYear() + '-' + (nextDate.getMonth() + 1) + '-' + nextDate.getDate());
      setTimeout(
        syncWithRu,
        next - date.getTime()
      );
    }


    function syncWithRu()
    {
      new Bluebird(fetchListOfRoutes)
      .then(
        ({routeStr, routes, routeCodes}) =>
        {
          state.routes = routes;
          state.routeCodes = routeCodes;

          let timestamp = Date.now();

          if (info.routesStr !== routeStr)
          {
            state.routestimestamp = timestamp;

            models.Info.update(
              { name: 'info' },
              {
                $set:
                {
                  routes,
                  routeStr,
                  routeCodes,
                  routestimestamp: timestamp
                }
              },
              () => {}
            );
          }

let count = 0;
          return routeCodes
            .filter( config.FILTER_BUSES_OUT )  // remove buses we are not interested in
            .reduce(
              ( acc, busCode ) =>
              {
                return acc.then(
                  (trassNotChanged) =>
                  {
                    return new Bluebird(
                      resolve =>
                      {
count++;
if (count % 10 === 0) console.log(count);
                        getVehicleTrass(busCode)
                        .then(
                          trass =>
                          {
                            if (trass && trass !== info.trassesStr[''+busCode])
                            { // response string changed
                              try
                              {
                                let temp = JSON.parse(trass);
                                info.trassesStr[''+busCode] = trass; // remember str
                                state.trasses[''+busCode] = temp.trasses[0].r[0].u
                                  .map(e => Object.assign({}, e, {
                                    lat: (+e.lat) + 0.00014,
                                    lng: (+e.lng) - 0.00009
                                  })); // object for clients
                                extractStopsFromTrass(state.trasses[''+busCode], busCode);  // put stops into state
                                resolve(false);
                              }
                              catch (err)
                              {
                                console.error(err.stack);
                                resolve(trassNotChanged || true);
                              }
                            }
                            else
                            {
                              resolve(trassNotChanged || true);
                            }
                          }
                        )
                        .catch(
                          () =>
                          {
                            resolve(trassNotChanged || true);
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
              notChanged =>
              {
console.log(!notChanged);
                if (!notChanged)
                {
                  models.Info.update(
                    { name: 'info' },
                    {
                      $set:
                      {
                        trassesStr: info.trassesStr,
                        trasses: state.trasses,
                        stops: state.stops,
                        busStops: state.busStops,
                        trassestimestamp: timestamp,
                      }
                    },
                    () => {}
                  );
                }
                return Bluebird.resolve();
              }
            );
        }
      )
      .then(
        () =>
        {
console.log('updated');
          models.Info.update(
            { name: 'info' },
            {
              $set:
              {
                updated: now
              }
            },
            () => {}
          );

          let date = new Date();
          let nextDate = new Date(date.getTime() + 1000 * 60 * 60 * 24);
          let next = Date.parse(nextDate.getFullYear() + '-' + (nextDate.getMonth()+1) + '-' + nextDate.getDate());
          setTimeout(
            syncWithRu,
            next - date.getTime()
          );
        }
      )
      .catch(
        err =>
        {
          console.error(err.stack);
        }
      );
    }
  }
);


/**
 * check when route list has been updated last time
 * if more then a day ago refresh
 * then resolve list of routes ro just their codes
 */
function fetchListOfRoutes(resolve, reject)
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

function getListOfRoutesResponseHandler(resolve, reject, err, httpResponse, body)
{
  if ( err )
  {
    console.error('getListOfRoutes request' );
    reject(err);
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getListOfRoutes request' );
    reject();
  }
  else
  {
    try
    {
      let routes = JSON.parse( body );

      let routeCodes =
        routes
        .reduce(
          ( acc, route ) => {
            var codes =
              route.ways.reduce(
                ( acc2, way ) => {
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

      resolve({routeStr: body, routes, routeCodes});
    }
    catch ( err )
    {
      console.error('getListOfRoutes parsing response');
      reject(err);
    }
  }
}


/**
 * get list of buses out there
 * @codes // concatenated codes
 */
function getListOfAvailableBuses( codes )
{
  return new Bluebird( fetchListOfAvailableBuses.bind( this, codes ) );
}

function fetchListOfAvailableBuses( codes, resolve, reject)
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
  resolve, reject, codesQuery,
  err, httpResponse, body)
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
      let data = JSON.parse( body ).markers;

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


function getVehicleTrass(busCode)
{
  return new Bluebird(
    resolve =>
    {
      request(
        {
          url: config.PROXY_URL,
          method: 'GET',
          qs: { url: encodeURI( config.NSK_TRASSES + busCode ) }
        },
        getVehicleTrassResponseHandler.bind(this, resolve)
      );
    }
  );
}

function getVehicleTrassResponseHandler(resolve, err, httpResponse, body)
{
  if ( err )
  {
    console.error( err.stack, 'getVehicleTrass request' );
    resolve();
  }
  else if ( httpResponse.statusCode !== 200 )
  {
    console.error( httpResponse.statusCode, 'not 200 response', 'getVehicleTrass request' );
    resolve();
  }
  else
  {
    resolve(body);
  }
}

/**
 * extract stops from a bus trass
 */
function extractStopsFromTrass(_points, busCode)
{
  let points = _points.filter(filterStops);
  for ( let point of points )
  {
    if ( !state.stops[point.id] )
    {
      state.stops[point.id] =
      {
        id: point.id,
        n: point.n,
        lat: point.lat,
        lng: point.lng,
        vehicles: {}
      };
    }
    state.stops[point.id].vehicles[busCode] = true;

    if ( !state.busStops[busCode] )
    {
      state.busStops[busCode] = {};
    }
    state.busStops[busCode][point.id] = true;
  }
}

function filterStops(e)
{
  return e['id'];
}


function getTrass(busCode, tsp)
{
  return state.trassestimestamp > tsp
    ?  state.trasses[busCode]
    : null
    ;
}