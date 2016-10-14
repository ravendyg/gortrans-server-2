/// <reference path="../index.d.ts" />
'use strict';

let io: SocketIO.Server;
import { subscribe } from '../../process/data-provider';

let listOfClients: {[socketId: string]: SocketClient} = {};
let listOfBusListeners: {[bus: string]: {ids: {[socketId: string]: boolean}}} = {};

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
    }
  );

  io.on(
    'disconnect',
    (socket: SocketIO.Socket) =>
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
  );

  io.on(
    'subscribe-to-bus',
    (data: any) =>
    {
      console.log(data);
    }
  );

  io.on(
    'unsubscribe-from-bus',
    (data: any) =>
    {
      console.log(data);
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