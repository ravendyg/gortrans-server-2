const WS = require('ws');
const url = require('url');

const messageTypes = {
    SUBSCRIBE: 1,
    UNSUBSCRIBE: 2,
    STATE: 3,
    CONFIRM: 4,
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

        const apiKey = query.api_key;
        logger.log('connected: ' + apiKey);
        const info = {
            ws,
            connected: date.now(),
            buses: [],
            confirmedId: '',
            apiKey,
        };
        connections.set(ws, info);

        ws.on('close', () => {
            logger.log('disconnected: ' + apiKey);
            connections.delete(ws);
        });

        ws.on('message', data => {
            try {
                const { type, code, confirmedId } = JSON.parse(data);
                switch (type) {
                    case messageTypes.SUBSCRIBE: {
                        info.buses = [...info.buses, code];
                        if (!busListeners[code]) {
                            busListeners[code] = new Set();
                        }
                        busListeners[code].add(info);
                        dataProvider.addBusToSchedule(code);
                        const reset = dataProvider.getCurrentState(code) || {};
                        const stateId = dataProvider.getStateId();
                        let message;
                        const payload = {
                            id: stateId,
                            data: {
                                [code]: { reset },
                            },
                        };
                        message = {
                            type: messageTypes.STATE,
                            payload,
                        };
                        ws.send(JSON.stringify(message));
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

                    case messageTypes.CONFIRM: {
                        info.confirmedId = confirmedId;
                        break;
                    }
                }
            } catch (e) {
                logger.error(e);
            }
        });
    });

    dataProvider.subscribe((changes, state) => {
        const { id, prevId } = state;
        connections.forEach(({ ws, buses, confirmedId }) => {
            const payload = { id, data: {} };
            let dispatchRequired = false;
            buses.forEach(busCode => {
                if (confirmedId !== prevId) {
                    // the client has not confirmed receiving the last state version
                    // her image of reality is outdated
                    dispatchRequired = true;
                    payload.data[busCode] = {
                        reset: state[busCode],
                    };
                    return;
                }

                if (changes[busCode] &&
                    Object.keys(changes[busCode].add).length +
                    Object.keys(changes[busCode].update).length +
                    changes[busCode].remove.length > 0
                ) {
                    dispatchRequired = true;
                    payload.data[busCode] = changes[busCode];
                }
            });
            if (dispatchRequired) {
                const message = {
                    type: messageTypes.STATE,
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
