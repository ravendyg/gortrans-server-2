const sinon = require('sinon');

module.exports = () => {
    const request = sinon.fake();

    return Object.assign(request, {});
};
