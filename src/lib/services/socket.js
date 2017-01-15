'use strict';

const dataProvider = require('../../process/data-provider');
const gortrans = require('./nskgortrans');

let io;

let listOfClients = {};
let listOfBusListeners = {};

// log connections every 1 hour
setTimeout(logConnection, 1000 * 60);
setInterval(logConnection, 1000 * 60 * 60);
function logConnection()
{
  for (let clientId of Object.keys(listOfClients))
  {
    console.log(clientId + ': ' + listOfClients[clientId].connected, listOfClients[clientId].buses);
  }
}

function start(server)
{
  io = require('socket.io')(server);

  // filter some crap
  io.use(
    (socket, next) =>
    {
      if (!socket.handshake.headers['host'].match('.nskgortrans.info') && !socket.handshake.headers['host'].match('192.168'))
      { // temporarily block everything from other domains
        next(new Error(''));
      }
      else
      {
        next();
      }
    }
  );

  io.on(
    'connection',
    (socket) =>
    {
      listOfClients[socket.id] =
      {
        socket,
        connected: Date.now(),
        buses: {}
      };

      socket.on( 'disconnect', disconnect.bind(this, socket) );

      socket.on( 'add bus listener', addBusListener.bind(this, socket) );

      socket.on( 'remove bus listener', removeBusListener.bind(this, socket) );
    }
  );

  dataProvider.subscribe(
    (changes) =>
    {
      for ( let socketId of Object.keys(listOfClients) )
      {
        let parcel = {};
        let dispatchRequired = false;
        for ( let busCode of Object.keys(listOfClients[socketId].buses) )
        {
          if ( changes[busCode] && (
            Object.keys(changes[busCode].add).length +
            Object.keys(changes[busCode].update).length +
            changes[busCode].remove.length
            > 0 )
          )
          {
            dispatchRequired = true;
            parcel[busCode] = changes[busCode];
          }
        }
        if ( dispatchRequired )
        {
          listOfClients[socketId].socket.emit(
            'bus update',
            parcel
          );
        }
      }
    }
  );
}
module.exports.start = start;



function disconnect(socket)
{
  let listOfBuses = Object.keys( listOfClients[socket.id].buses );
  for ( let bus of listOfBuses )
  {
    if ( listOfBusListeners[bus] )
    {
      delete listOfBusListeners[bus].ids[ socket.id ];
      if ( Object.keys(listOfBusListeners[bus].ids).length === 0 )
      {
        dataProvider.removeBusFromSchedule(bus);
      }
    }
  }
  delete listOfClients[socket.id];
}

function addBusListener(socket, busCode, tsp)
{
  // register listener
  listOfClients[socket.id].buses[busCode] = true;
  if ( !listOfBusListeners[busCode] )
  {
    listOfBusListeners[busCode] = { ids: {} };
  }
  listOfBusListeners[busCode].ids[socket.id] = true;

  dataProvider.addBusToSchedule(busCode);

  // send current state
  let _state = {};
  _state[busCode] = dataProvider.getCurrentState(busCode);
  socket.emit(
    'bus listener created',
    busCode,
    _state,
    gortrans.getTrass(busCode, tsp)
  );
}

function removeBusListener(socket, code)
{
  try
  {
    delete listOfClients[socket.id].buses[code];
    delete listOfBusListeners[code].ids[socket.id];
    if ( Object.keys(listOfBusListeners[code].ids).length === 0 )
    {
      dataProvider.removeBusFromSchedule(code);
    }
  }
  catch (err)
  {
    console.error(err, listOfClients, listOfBusListeners, code, 'removing bus listener');
  }
}