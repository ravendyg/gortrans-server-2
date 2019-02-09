function createStorageService({
    config,
    logger,
    fs,
    path,
    utils,
}) {
    const existsPromised = (filePath) => new Promise(resolve => {
        fs.exists(filePath, exists => {
            return resolve(exists);
        });
    });

    const readPromised = (filePath) => new Promise((resolve, reject) => {
        fs.readFile(filePath, (readErr, result) => {
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

    const _get = async (fileName) => {
        let filePath = path.join(config.DATA_DIR, fileName);
        let exists = await existsPromised(filePath);
        if (exists) {
            return await readPromised(filePath);
        } else {
            return null;
        }
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
        _set(path.join(config.DATA_DIR, config.DATA_ROUTES_INFO_FILE), wrappedRoutesInfo);

    return {
        getRoutesInfo,
        getTrassInfo,
        setRoutesInfo,
        setTrassInfo,
    };
}

module.exports = createStorageService;
