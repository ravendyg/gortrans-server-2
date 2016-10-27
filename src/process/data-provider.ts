/// <reference path="../lib/index.d.ts" />
'use strict';

const request = require('request');
const events = require('events');
const emitter = new events.EventEmitter();
const bb = require('bluebird');

import {Promise} from 'es6-promise';

import { config } from '../lib/config';
import { errServ } from '../lib/error';
import { utils } from '../lib/utils';

import { gortrans } from '../lib/services/nskgortrans';

const dataProvider =
{
  startProcess, subscribe
};
export { dataProvider, subscribe, getCurrentState, tryToRescheduleCheck };

let schedule: Schedule;

let currentState: State = {};
let newState: State = {};

let subscribers: Subscribers = {};

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
 * put this bus on the next scheduled fetch
 * call if smbd requested it's data
 */
function tryToRescheduleCheck( busCode: string ): void
{
  if ( schedule[busCode] && schedule[busCode].nextRun > 1 )
  {
    schedule[busCode].nextRun = 1;
  }
}

/**
 * get bus markers for all
 */
function fetchData()
{
  let calls = [ bb.resolve() ];  // in case no calls required

  let keyList: string [] = [];
  for ( let key in schedule )
  {
    if ( --schedule[key].nextRun <= 0 )
    {
      keyList.push( key );

      if ( keyList.length === 5 )
      {
        calls.push(
          gortrans.getListOfAvailableBuses( keyList.join('|') )
        );
        keyList = [];
      }
    }
  }

  if ( keyList.length > 0 )
  { // last group smaller than 5
    calls.push(
      gortrans.getListOfAvailableBuses( keyList.join('|') )
    );
  }

  return bb.all( calls )
  .then( processBusData )
  .then( notifyListeners )
  .catch(
    (err: ExpressError) =>
    {
      console.error( err, 'fetch data');
      scheduleNextRun();
    }
  );
}

function processBusData (data: {[busCode: string]: busData []} []): StateChanges
{
  data = data.slice(1); // remove initial Promise.resolve
  for ( let buses of data )
  {
    for ( let busCode of Object.keys(buses) )
    {
      if ( buses[busCode].length === 0 )
      { // no buses
        if ( schedule[busCode].numberOfEmptyRuns < 7 )
        { // some limit against infinity
          schedule[busCode].numberOfEmptyRuns++;
        }
      }
      else
      {
        schedule[busCode].numberOfEmptyRuns = 0;
      }
      schedule[busCode].nextRun = Math.pow(2, schedule[busCode].numberOfEmptyRuns);
    }
  }

  let changes: StateChanges = {};

  if ( data.length > 0 )
  { // send data to socket delivery service
    newState = <any>
      data
      .filter( utils.hasKeys )
      .reduce( utils.flatArrayToDict, {} );

    // for each key in new state compare array corresponding to this key to the array in state
    // using time_nav as reference

    for ( let busCode of Object.keys( newState ) )
    {
      if ( currentState[ busCode ] )
      {
        changes[ busCode ] =
        {
          update: {},
          add: {},
          remove: []
        };

        for ( let graph of Object.keys( newState[ busCode ] ) )
        { // updates
          if ( !currentState[busCode][graph] )
          { // new bus
            changes[ busCode ].add[graph] = newState[busCode][graph];
          }
          else if ( newState[busCode][graph].time_nav !== currentState[busCode][graph].time_nav )
          { // smth changed
            changes[ busCode ].update[graph] = newState[busCode][graph];
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
          update: {},
          add: newState[ busCode ],
          remove: []
        };
      }
    }
    // done comparing, get rid of old state
    Object['assign']( currentState, newState);
  }
  scheduleNextRun();

  return changes;
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
    gortrans.getListOfRouteCodes(0)
    .then(
      ( {routeCodes, timestamp}: {routeCodes: string [], timestamp: number} ) => {

        schedule = {};
        // remove buses we are not interested in
        routeCodes = routeCodes.filter( config.FILTER_BUSES_OUT );
        for ( let i = 0; i < routeCodes.length; i++ ) {
          schedule[ routeCodes[i] ] =
          {
            nextRun: 1,
            numberOfEmptyRuns: 0
          };
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
  return new bb( main );
}

function notifyListeners(changes: StateChanges)
{
  for ( let key of Object.keys(subscribers) )
  {
    subscribers[key]( changes );
  }
}

function subscribe( cb: ( changes: StateChanges ) => void ): () => void
{
  let key = Date.now().toString() + Math.random();
  subscribers[ key ] = cb;

  return () => { delete subscribers[key]; };
}

/**
 * return current state for given code
 */
function getCurrentState(busCode: string)
{
  return currentState[ busCode ] || {};
}