const fs = require('fs');

const config = require('../config');

const getRoutesInfo = () => {
    return new Promise((resolve, reject) => {
        fs.exists(config.DATA_ROUTES_INFO_FILE, exists => {
            if (!exists) {
                return resolve(null);
            }
            fs.readFile(config.DATA_ROUTES_INFO_FILE, (readErr, result) => {
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

const setRoutesInfo = (wrappedRoutesInfo) => {
    fs.writeFile(
        config.DATA_ROUTES_INFO_FILE,
        JSON.stringify(wrappedRoutesInfo),
        { encoding: 'utf8' }
    );
}

module.exports = {
    getRoutesInfo,
    setRoutesInfo,
};
