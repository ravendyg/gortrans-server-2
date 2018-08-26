const sinon = require('sinon');

module.exports = () => {
    return {
        error: sinon.fake(() => { }),
        log: sinon.fake(() => { }),
    };
}
