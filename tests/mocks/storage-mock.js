const sinon = require('sinon');

module.exports = () => {
    let results = [ null, null ];
    const updateResults = (args) => {
        results = args;
    };
    const _get = () => {
        const [ err, res ] = results;
        if (err) {
            return Promise.reject(err);
        }
        return Promise.resolve(res);
    };
    const _set = () => {

    };
    const getRoutesInfo = (...args) => _get(...args);
    const setRoutesInfo = (...args) => _set(...args);
    const getTrassInfo = (...args) => _get(...args);
    const setTrassInfo = (...args) => _set(...args);

    return {
        getRoutesInfo: sinon.fake(getRoutesInfo),
        getTrassInfo: sinon.fake(getTrassInfo),
        setRoutesInfo: sinon.fake(setRoutesInfo),
        setTrassInfo: sinon.fake(setTrassInfo),
        updateResults,
    };
};
