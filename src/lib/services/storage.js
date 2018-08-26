function createStorageService({
    config,
    logger,
    fs,
    utils,
}) {
    const _get = (fileName) => {
        return new Promise((resolve, reject) => {
            fs.exists(fileName, exists => {
                if (!exists) {
                    return resolve(null);
                }
                fs.readFile(fileName, (readErr, result) => {
                    if (readErr) {
                        return reject(readErr);
                    }
                    try {
                        return resolve(JSON.parse(result));
                    } catch (parseErr) {
                        return reject(parseErr);
                    }
                });
            });
        });
    };

    const _set = (fileName, data) => {
        fs.writeFile(fileName, JSON.stringify(data),
            { encoding: 'utf8' },
            (err) => {
                if (err) {
                    logger.error(err.stack);
                }
            },
        );
    };

    const getTrassInfo = (trassKey) => {
        const fileName = utils.getTrassStorageFileName(trassKey, config);
        return _get(fileName);
    };

    const setTrassInfo = (wrappedTrassInfo, trassKey) => {
        const fileName = utils.getTrassStorageFileName(trassKey, config);
        return _set(fileName, wrappedTrassInfo);
    };

    const getRoutesInfo = () => _get(config.DATA_ROUTES_INFO_FILE);

    const setRoutesInfo = (wrappedRoutesInfo) =>
        _set(config.DATA_ROUTES_INFO_FILE, wrappedRoutesInfo);

    return {
        getRoutesInfo,
        getTrassInfo,
        setRoutesInfo,
        setTrassInfo,
    };
}

module.exports = createStorageService;
