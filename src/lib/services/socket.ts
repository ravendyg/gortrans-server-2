/// <reference path="../index.d.ts" />
'use strict';

let io: SocketIO.Server;
import { subscribe } from '../../process/data-provider';

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

      socket.on( 'add bus listener', addBusListenere );

      socket.on( 'remove bus listener', removeBusListener );
    }
  );

  subscribe(
    (changes: StateChanges) =>
    {
      console.log(changes);
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

function addBusListenere(code: string)
{
  listOfClients[socket.id].buses[code] = true;
  listOfBusListeners[code].ids[socket.id] = true;
}

function removeBusListener(code: string)
{
  delete listOfClients[socket.id].buses[code];
  delete listOfBusListeners[code].ids[socket.id];
}