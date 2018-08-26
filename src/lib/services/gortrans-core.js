function createGortransService({
    config,
    logger,
    request,
}) {
    const _handle = (key, resolve, postHandler, httpErr, httpResponse, body) => {
        if (httpErr) {
            logger.error(httpErr);
            return resolve(null);
        } else if (httpResponse.statusCode !== 200) {
            logger.error(`${key}: status code ${httpResponse.statusCode} - ${(body || '').slice(0, 100)}`);
            return resolve(null);
        } else {
            try {
                const data = JSON.parse(body);
                if (typeof postHandler === 'function') {
                    const _data = postHandler(data);
                    return resolve(_data);
                } else {
                    return resolve(data);
                }
            } catch (_err) {
                logger.error(`${key}: parse error - ${body}`);
                return resolve(null);
            }
        }
    };

    const _get = (key, url, postHandler) => {
        return new Promise(resolve => {
            request(
                {
                    headers: {
                        url,
                        'x-auth-token': config.API_KEY,
                    },
                    method: 'GET',
                    url: config.PROXY_URL,
                },
                (httpErr, httpResponse, body) =>
                    _handle(key, resolve, postHandler, httpErr, httpResponse, body)
            );
        });
    };

    return {
        getRoutesInfo: () => _get('getRoutesInfo', config.NSK_ROUTES),
        getTrassInfo: (trassKey, postHandler) => _get('getTrassInfo', config.NSK_TRASSES + trassKey, postHandler),
    };
}

module.exports = createGortransService;
