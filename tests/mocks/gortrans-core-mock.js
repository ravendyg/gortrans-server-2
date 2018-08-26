const sinon = require('sinon');

module.exports = () => {
    let result = null;
    const updateResult = (res) => {
        result = res;
    };
    const getRoutesInfo = () => {
        return Promise.resolve(result);
    };

    return {
        getRoutesInfo: sinon.fake(getRoutesInfo),
        updateResult,
    };
};
