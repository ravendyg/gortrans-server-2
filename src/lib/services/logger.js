const map = new WeakMap();

module.exports = ({ date }) => {
    const logger = {
        debug: console.debug,
        error: console.error,
        log: console.log,
        // important! mutates response object
        startRequestLog(req, res) {
            map.set(req, date.now());
            const finish = () => {
                const ip = req.headers['x-real-ip'];
                const apiKey = req.query.api_key || '';
                const tsp = map.get(req);
                const len = tsp
                    ? date.now() - tsp
                    : '';
                logger.log(`${ip} ${apiKey} ${req.method} ${req.url} ${res.statusCode} ${len}`);
            };
            res._oldEnd = res.end;
            res._oldSend = res.send;
            res.end = function () {
                res._oldEnd();
                finish();
            };
            res.send = function (...args) {
                res.end = res._oldEnd;
                res._oldSend(...args);
                finish();
            };
        },
    };

    return logger;
};
