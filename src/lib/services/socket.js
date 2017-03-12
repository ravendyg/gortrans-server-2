'use strict';

const dataProvider = require('../../process/data-provider');
const gortrans = require('./nskgortrans');

const logger = require('../db/log');

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

  io.use(
    (socket, next) =>
    {
      let apiKey = +socket.handshake.query.api_key;
      let ip = socket.handshake.headers['x-real-ip'];
      let agent = socket.handshake.headers['user-agent'];
      if (!apiKey)
      {
        next(new Error(''));
      }
      else
      {
        socket._info = {
          apiKey, ip, agent,
          requests: {}
        };
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

      socket._info.connectionDoc = logger.createRecord({
        apiKey: socket._info.apiKey, action: 'connect',
        ip: socket._info.ip, target: '',
        agent: socket._info.agent
      });

      socket.on('disconnect', disconnect.bind(this, socket));

      socket.on('add bus listener', addBusListener.bind(this, socket));

      socket.on('remove bus listener', removeBusListener.bind(this, socket));
    }
  );

  dataProvider.subscribe(
    (changes) =>
    {
      for (let socketId of Object.keys(listOfClients))
      {
        let parcel = {};
        let dispatchRequired = false;
        for (let busCode of Object.keys(listOfClients[socketId].buses))
        {
          if (changes[busCode] &&
            Object.keys(changes[busCode].add).length +
            Object.keys(changes[busCode].update).length +
            changes[busCode].remove.length
            > 0)
          {
            dispatchRequired = true;
            parcel[busCode] = changes[busCode];
          }
        }
        if (dispatchRequired)
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
  let listOfBuses = Object.keys(listOfClients[socket.id].buses);
  for (let bus of listOfBuses)
  {
    if (listOfBusListeners[bus])
    {
      delete listOfBusListeners[bus].ids[ socket.id ];
      if (Object.keys(listOfBusListeners[bus].ids).length === 0)
      {
        dataProvider.removeBusFromSchedule(bus);
      }
    }
  }
  delete listOfClients[socket.id];

  socket._info.connectionDoc
  .then(_id =>
  {
    logger.recordEnd(_id);
    for (let code of Object.keys(socket._info.requests))
    {
      socket._info.requests[code]
      .then(logger.recordEnd);
    }
  });
}

function addBusListener(socket, busCode, tsp)
{
  socket._info.requests[busCode] =
    logger.createRecord({
      apiKey: socket._info.apiKey, action: 'listen',
      ip: socket._info.ip, target: busCode,
      agent: socket._info.agent
    });

  // register listener
  listOfClients[socket.id].buses[busCode] = true;
  if (!listOfBusListeners[busCode])
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
  socket._info.requests[code]
  .then(_id =>
  {
    logger.recordEnd(_id);
    delete socket._info.requests[code];
  });

  try
  {
    delete listOfClients[socket.id].buses[code];
    delete listOfBusListeners[code].ids[socket.id];
    if (Object.keys(listOfBusListeners[code].ids).length === 0)
    {
      dataProvider.removeBusFromSchedule(code);
    }
  }
  catch (err)
  {
    console.error(err, listOfClients, listOfBusListeners, code, 'removing bus listener');
  }
}