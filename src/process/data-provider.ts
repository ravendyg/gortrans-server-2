/// <reference path="../lib/index.d.ts" />
'use strict';

const request = require('request');
const events = require('events');
const emitter = new events.EventEmitter();

import * as Bluebird from 'bluebird';

import { config } from '../lib/config';
import { errServ } from '../lib/error';
import { utils } from '../lib/utils';

import { gortrans } from '../lib/services/nskgortrans';

const dataProvider =
{
  startProcess, subscribe
};
export { dataProvider, subscribe, getCurrentState,
  addBusToSchedule, removeBusFromSchedule };

// let schedule: Schedule;
let schedule: {[busCode: string]: boolean} = {};

let rescheduleId: any = {};
rescheduleId['_called'] = true;

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
function startProcess()
{
  fetchData();
}
module.exports.startProcess = startProcess;

/**
 * put this bus on the next scheduled fetch
 * call if smbd requested it's data
 */
function addBusToSchedule( busCode: string ): void
{
  if ( !schedule[busCode] )
  {
    schedule[busCode] = true;
    fetchData();
  }
}

function removeBusFromSchedule( busCode: string ): void
{
  if ( schedule[busCode] )
  {
    delete schedule[busCode];
  }
}

/**
 * get bus markers for all
 */
function fetchData()
{
  let calls: Bluebird<indexedBusData> [] = [ Bluebird.resolve({}) ];  // in case no calls required

  let keyList: string [] = [];
  for ( let busCode of Object.keys(schedule) )
  {
    keyList.push( busCode );

    if ( keyList.length === 5 )
    {
      calls.push(
        gortrans.getListOfAvailableBuses( keyList.join('|') )
      );
      keyList = [];
    }
  }

  if ( keyList.length > 0 )
  { // last group smaller than 5
    calls.push(
      gortrans.getListOfAvailableBuses( keyList.join('|') )
    );
  }

  return Bluebird.all( calls )
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
  data = data.slice(1); // remove initial Bluebird.resolve

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
  if (rescheduleId._called)
  {
    rescheduleId =
      setTimeout(
        () =>
        {
          emitter.emit('data provider next run');
        },
        untilNextTime
      );
  }
  else
  {
    // already scheduled, do nothing
  }
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