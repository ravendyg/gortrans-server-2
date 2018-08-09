'use strict';

const dataProvider = require('../../process/data-provider');
const gortrans = require('./nskgortrans');

let io;

const listOfClients = {};
const listOfBusListeners = {};
let history = {};

// log connections every 1 hour
setTimeout(logConnection, 1000 * 60);
setInterval(logConnection, 1000 * 60 * 30);
function logConnection() {
    console.log((new Date()).toLocaleTimeString(), history);
    history = {};
}

const suspiciousIps = [
    '85.26.225.238'
];

function start(server) {
    io = require('socket.io')(server);

    io.use(
        (socket, next) => {
            let apiKey = +socket.handshake.query.api_key || -1;
            let ip = socket.handshake.headers['x-real-ip'];
            let agent = socket.handshake.headers['user-agent'];
            if (!apiKey || suspiciousIps.indexOf(ip) !== -1) {
                next(new Error(''));
            } else {
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
        (socket) => {
            listOfClients[socket.id] =
                {
                    socket,
                    connected: Date.now(),
                    buses: {},
                };

            const apiKey = socket._info.apiKey;

            if (!history[apiKey]) {
                history[apiKey] = [socket.handshake.headers['x-real-ip'], socket.handshake.headers['user-agent'], {}];
            }

            socket.on('disconnect', disconnect.bind(this, socket));

            socket.on('add bus listener', addBusListener.bind(this, socket));

            socket.on('remove bus listener', removeBusListener.bind(this, socket));
        }
    );

    dataProvider.subscribe(
        (changes) => {
            for (let socketId of Object.keys(listOfClients)) {
                let parcel = {};
                let dispatchRequired = false;
                for (let busCode of Object.keys(listOfClients[socketId].buses)) {
                    if (changes[busCode] &&
                        Object.keys(changes[busCode].add).length +
                        Object.keys(changes[busCode].update).length +
                        changes[busCode].remove.length
                        > 0) {
                        dispatchRequired = true;
                        parcel[busCode] = changes[busCode];
                    }
                }
                if (dispatchRequired) {
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

function disconnect(socket) {
    let listOfBuses = Object.keys(listOfClients[socket.id].buses);
    for (let bus of listOfBuses) {
        if (listOfBusListeners[bus]) {
            delete listOfBusListeners[bus].ids[socket.id];
            if (Object.keys(listOfBusListeners[bus].ids).length === 0) {
                dataProvider.removeBusFromSchedule(bus);
            }
        }
    }
    delete listOfClients[socket.id];
}

function addBusListener(socket, busCode, tsp) {
    const apiKey = socket._info.apiKey;

    // register listener
    listOfClients[socket.id].buses[busCode] = true;
    if (history[apiKey]) {
        history[apiKey][2][busCode] = true;
    }

    if (!listOfBusListeners[busCode]) {
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

function removeBusListener(socket, code) {
    delete socket._info.requests[code];

    try {
        delete listOfClients[socket.id].buses[code];
        delete listOfBusListeners[code].ids[socket.id];
        if (Object.keys(listOfBusListeners[code].ids).length === 0) {
            dataProvider.removeBusFromSchedule(code);
        }
    } catch (err) {
        console.error(err, listOfClients, listOfBusListeners, code, 'removing bus listener');
    }
}
