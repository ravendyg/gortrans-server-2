'use strict';

const events = require('events');
const emitter = new events.EventEmitter();

const Bluebird = require('bluebird');

const config = require('../lib/config');
const utils = require('../lib/utils');

const gortrans = require('../lib/services/nskgortrans');


module.exports =
{
  startProcess,
  subscribe,
  addBusToSchedule, removeBusFromSchedule,
  getCurrentState
};

let schedule = {};

let rescheduleId = {};
rescheduleId['_called'] = true;

let currentState = {};
let newState = {};

let subscribers = {};

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

/**
 * put this bus on the next scheduled fetch
 * call if smbd requested it's data
 */
function addBusToSchedule( busCode )
{
  if ( !schedule[busCode] )
  {
    schedule[busCode] = true;
    fetchData();
  }
}

function removeBusFromSchedule( busCode )
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
  let calls = [ Bluebird.resolve({}) ];  // in case no calls required

  let keyList = [];
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
    (err) =>
    {
      console.error( err, 'fetch data');
      scheduleNextRun();
    }
  );
}

function processBusData (data)
{
  data = data.slice(1); // remove initial Bluebird.resolve

  let changes = {};

  if ( data.length > 0 )
  { // send data to socket delivery service
    newState = {};
    var _newState =
      data
      .filter( utils.hasKeys )
      .reduce( utils.flatArrayToDict, {} );

    // for each key in new state compare array corresponding to this key to the array in state
    // using time_nav as reference

    for ( let busCode of Object.keys(_newState) )
    {
      newState[busCode] = {};
      for (let graph of Object.keys(_newState[busCode]))
      {
        newState[busCode][graph] = copyBusDataReduced(_newState[busCode][graph]);
      }

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


function notifyListeners(changes)
{
  // let changesReduced = {};
  // for (let code of Object.keys(changes))
  // {
  //   changesReduced[code] = {add: {}, update: {}, remove: changes[code].remove};
  //   for (let graph of Object.keys(changes[code].add))
  //   {
  //     changesReduced[code].add[graph] = copyBusDataReduced(changes[code].add[graph]);
  //   }
  //   for (let graph of Object.keys(changes[code].update))
  //   {
  //     changesReduced[code].update[graph] = copyBusDataReduced(changes[code].update[graph]);
  //   }
  // }
  for ( let key of Object.keys(subscribers) )
  {
    subscribers[key](changes);
    // subscribers[key]( changesReduced );
  }
}

function subscribe( cb )
{
  let key = Date.now().toString() + Math.random();
  subscribers[ key ] = cb;

  return () => { delete subscribers[key]; };
}

/**
 * return current state for given code
 */
function getCurrentState(busCode)
{ // don't reduce current state, since it's also used by raps providing route
  // can survive with that much data overhead
  return currentState[ busCode ] || {};
}

function copyBusDataReduced(data)
{
  return {
    title: data.title,
    id_typetr: +data.id_typetr,
    marsh: data.marsh,
    graph: +data.graph,
    direction: data.direction,
    lat: +data.lat,
    lng: +data.lng,
    time_nav: data.time_nav,
    azimuth: +data.azimuth,
    speed: +data.speed
  };
}