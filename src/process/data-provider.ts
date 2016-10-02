/// <reference path="../lib/index.d.ts" />
'use strict';

const request = require('request');
const events = require('events');
const emitter = new events.EventEmitter();
const Promise = require('bluebird');

import { config } from '../lib/config';
import { errServ } from '../lib/error';
import { utils } from '../lib/utils';

import { gortrans } from '../lib/services/nskgortrans';

let schedule: Schedule;

let currentState: State = {};
let newState: State = {};

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
    () =>
    {
      scheduleNextRun();
    }
  );
}
module.exports.startProcess = startProcess;

/**
 * get bus markers for all
 */
function fetchData()
{
  let calls = [ Promise.resolve() ];  // in case no calls required

  for ( let key in schedule )
  {
    if ( --schedule[key].nextRun === 0 )
    {
      // later implement smarter scheduler algorithm
      schedule[key].nextRun = 1;

      calls.push(
        gortrans.getListOfAvailableBuses( key )
      );
    }
  }

  return Promise.all( calls )
  .then( processBusData )
  .catch(
    (err: ExpressError) =>
    {
      console.error( err, 'fetch data');
      scheduleNextRun();
    }
  );
}

function processBusData (data: busData [])
{
  if ( data.length > 1 )
  { // send data to socket delivery service
    newState =
      data
      .slice(1)
      .filter( utils.hasKeys )
      .reduce( utils.flatArrayToDict, {} );

    // for each key in new state compare array corresponding to this key to the array in state
    // using time_nav as reference
    let changes: StateChanges = {};

    for ( let busCode of Object.keys( newState ) )
    {
      if ( currentState[ busCode ] )
      {
        changes[ busCode ] =
        {
          update: {},
          remove: []
        };

        for ( let graph of Object.keys( newState[ busCode ] ) )
        { // updates
          if ( newState[busCode][graph].time_nav !== currentState[busCode][graph].time_nav )
          { // smth changed
            changes[ busCode ].update[graph] = currentState[busCode][graph];
          }
        }

        for ( let graph of Object.keys( currentState[ busCode ] ) )
        { // remove
          if ( !newState[busCode][graph] )
          { // removed
            changes[ busCode ].remove.push( graph );
          }
        }
      }
      else
      { // completely new
        changes[ busCode ] =
        {
          update: newState[ busCode ],
          remove: []
        };
      }
    }
    // done comparing, get rid of old state
    currentState = newState;

    console.log( changes );

  }
  scheduleNextRun();
}

/**
 *
 */
function scheduleNextRun()
{
  let now = Date.now();
  let untilNextTime =
    Math.ceil( now / config.DATA_RETRIEVAL_PERIOD ) * config.DATA_RETRIEVAL_PERIOD - now;
  setTimeout(
    () =>
    {
      emitter.emit('data provider next run');
    },
    untilNextTime
  );
}


/**
 * reset schedule object
 */
function resetSchedule()
{
  function main( resolve: any, reject: any ) {
    gortrans.getListOfRouteCodes()
    .then(
      ( routeCodes: string [] ) => {

        schedule = {};
        for ( let i = 0; i < routeCodes.length; i++ ) {
// debug limit
if ( routeCodes[i].match(/1-036-W/) || routeCodes[i].match(/1-045-W/) ) {
          schedule[ routeCodes[i] ] =
          {
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