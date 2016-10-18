/// <reference path="../index.d.ts" />
'use strict';

let io: SocketIO.Server;
import { subscribe, getCurrentState } from '../../process/data-provider';

let listOfClients: {[socketId: string]: SocketClient} = {};
let listOfBusListeners: {[bus: string]: {ids: {[socketId: string]: boolean}}} = {};

let socket: SocketIO.Socket;

function start(server: any)
{
  io = require('socket.io')(server);

  io.on(
    'connection',
    (socket: SocketIO.Socket) =>
    {
      listOfClients[socket.id] =
      {
        socket,
        buses: {}
      };

      socket.on( 'disconnect', disconnect.bind(this, socket) );

      socket.on( 'add bus listener', addBusListenere.bind(this, socket) );

      socket.on( 'remove bus listener', removeBusListener.bind(this, socket) );
    }
  );

  subscribe(
    (changes: StateChanges) =>
    {
      for ( let socketId of Object.keys(listOfClients) )
      {
        let parcel: StateChanges = {};
        let dispatchRequired = false;
        for ( let busCode of Object.keys(listOfClients[socketId].buses) )
        {
          if (  Object.keys(changes[busCode].add).length +
                Object.keys(changes[busCode].update).length +
                changes[busCode].remove.length
                > 0
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



function disconnect(socket: SocketIO.Socket)
{
  let listOfBuses: string [] = Object.keys( listOfClients[socket.id].buses );
  for ( let bus of listOfBuses )
  {
    if ( listOfBusListeners[bus] )
    {
      delete listOfBusListeners[bus].ids[ socket.id ];
    }
  }
  delete listOfClients[socket.id];
}

function addBusListenere(socket: SocketIO.Socket, busCode: string)
{
  // register listener
  listOfClients[socket.id].buses[busCode] = true;
  if ( !listOfBusListeners[busCode] )
  {
    listOfBusListeners[busCode] = { ids: {} };
  }
  listOfBusListeners[busCode].ids[socket.id] = true;

  // send current state
  let _state: State = {};
  _state[busCode] = getCurrentState(busCode);
  socket.emit(
    'bus listener created',
    _state
  );
}

function removeBusListener(socket: SocketIO.Socket, code: string)
{
  try
  {
    delete listOfClients[socket.id].buses[code];
    delete listOfBusListeners[code].ids[socket.id];
  }
  catch (err)
  {
    console.error(err, listOfClients, listOfBusListeners, code, 'removing bus listener');
  }
}