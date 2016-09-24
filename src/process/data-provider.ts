/// <reference path="../lib/index.d.ts" />
'use strict';

const request = require('request');
const events = require('events');
const emitter = new events.EventEmitter();

import { config } from '../lib/config';
import { errServ } from '../lib/error';

import { gortrans } from '../lib/services/nskgortrans';

var schedule: Schedule;

emitter.on(
  'data provider next run',
  fetchData
);

/**
 * start with the server
 * daily check list of routes
 */
function startProcess() {
  resetSchedule()
  .then( fetchData )
  .catch(
    () => {
      scheduleNextRun();
    }
  );
}
module.exports.startProcess = startProcess;

/**
 * get bus markers for all
 */
function fetchData() {
  let calls = [ Promise.resolve([]) ];  // in case no calls reuired

  for ( let key in schedule ) {
    if ( --schedule[key].nextRun === 0 ) {
      // later implement smarter scheduler algorithm
      schedule[key].nextRun = 1;

      calls.push(
        gortrans.getListOfAvailableBuses( key )
      );
    }
  }

  Promise.all( calls )
  .then(
    data => {
      if ( data.length > 1 ) { // send data to socket delivery service
        console.log( data.slice(1) );
      }
      scheduleNextRun();
    }
  )
  .catch(
    err => {
      console.error( err, 'fetch data');
      scheduleNextRun();
    }
  );
}

/**
 *
 */
function scheduleNextRun() {
  let now = Date.now();
  let untilNextTime =
    Math.ceil( now / config.DATA_RETRIEVAL_PERIOD ) * config.DATA_RETRIEVAL_PERIOD - now;
  setTimeout(
    () => {
      emitter.emit('data provider next run');
    },
    untilNextTime
  );
}


/**
 * reset schedule object
 */
function resetSchedule() {
  function main( resolve: any, reject: any ) {
    gortrans.getListOfRoutes()
    .then(
      ( routes: ListMarsh [] ) => {
        var routeCodes =
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

        schedule = {};
        for ( let i = 0; i < routeCodes.length; i++ ) {
// debug limit
if ( routeCodes[i].match(/1-036-W/) || routeCodes[i].match(/1-045-W/) ) {
          schedule[ routeCodes[i] ] = {
            nextRun: 1
          };
}
        }

        resolve();
      }
    )
    .catch(
      ( err: ExpressError ) => {
        reject(err);
      }
    );
  }
  return new Promise( main );
}