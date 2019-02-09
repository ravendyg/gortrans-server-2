function hasKeys(obj) {
    return Object.keys(obj).length > 0;
}

function flatArrayToDict(acc, e) {
    for (let key of Object.keys(e)) {
        acc[key] = e[key].reduce(busListToDict, {});
    }
    return acc;
}

function busListToDict(acc, bus) {
    acc[bus.graph] = bus;
    return acc;
}

function verifyApiKey(req, res, next) {
    let apiKey = req.query.api_key;
    if (!apiKey) {
        let err = new Error('Not authorized');
        err.status = 403;
        return next(err);
    }
    return next();
}

const getTrassStorageFileName = (trassKey) => `trass_info_${trassKey}.json`;

const utils = {
    flatArrayToDict,
    getTrassStorageFileName,
    hasKeys,
    verifyApiKey,
};

module.exports = utils;
