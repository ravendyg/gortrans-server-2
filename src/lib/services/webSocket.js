const WS = require('ws');
const url = require('url');

const messageTypes = {
    SUBSCRIBE: 1,
    UNSUBSCRIBE: 2,
    STATE: 3,
    UPDATE: 4,
};

const connections = new Map();
const busListeners = {};

function start({
    server,
    dataProvider,
    logger,
    date,
}) {
    const wss = new WS.Server({
        path: '/ws',
        server,
    });

    wss.on('connection', (ws, req) => {
        const query = url.parse(req.url).query
            .split('&')
            .map(item => item.split('='))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        const info = {
            ws,
            connected: date.now(),
            buses: [],
            apiKey: query.api_key,
        };
        connections.set(ws, info);

        ws.on('close', () => {
            logger.log('closed');
            connections.delete(ws);
        });

        ws.on('message', data => {
            try {
                const { type, code } = JSON.parse(data);
                switch (type) {
                    case messageTypes.SUBSCRIBE: {
                        info.buses = [...info.buses, code];
                        if (!busListeners[code]) {
                            busListeners[code] = new Set();
                        }
                        busListeners[code].add(info);
                        dataProvider.addBusToSchedule(code);
                        const add = dataProvider.getCurrentState(code);
                        if (add) {
                            const payload = { [code]: { add } };
                            const message = {
                                type: messageTypes.STATE,
                                payload,
                            };
                            ws.send(JSON.stringify(message));
                        }
                        break;
                    }
                    case messageTypes.UNSUBSCRIBE: {
                        info.buses = info.buses.filter(_code => _code !== code);
                        busListeners[code].delete(info);
                        if (busListeners[code].size === 0) {
                            delete busListeners[code];
                            dataProvider.removeBusFromSchedule(code);
                        }
                        break;
                    }
                }
            } catch (e) {
                logger.error(e);
            }
        });
    });

    dataProvider.subscribe(changes => {
        connections.forEach(({ ws, buses }) => {
            const payload = {};
            let dispatchRequired = false;
            buses.forEach(busCode => {
                if (changes[busCode] &&
                    Object.keys(changes[busCode].add).length +
                    Object.keys(changes[busCode].update).length +
                    changes[busCode].remove.length > 0
                ) {
                    dispatchRequired = true;
                    payload[busCode] = changes[busCode];
                }
            });
            if (dispatchRequired) {
                const message = {
                    type: messageTypes.UPDATE,
                    payload,
                };
                ws.send(JSON.stringify(message));
            }
        });
    });
}

module.exports = {
    start,
};
