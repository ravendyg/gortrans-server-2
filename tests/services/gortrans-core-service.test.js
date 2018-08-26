const sinon = require('sinon');
const { assert } = require('chai');

const helpers = require('../helpers');
const createGortrans = require('../../src/lib/services/gortrans-core');
const request = require('../mocks/request-mock')();
const logger = require('../mocks/logger-mock')();
const config = {
    NSK_ROUTES: 'NSK_ROUTES',
    PROXY_URL: 'PROXY_URL',
};
const gortrans = createGortrans({
    config,
    logger,
    request,
});

describe('Gortrans service', () => {
    it('initializes', () => {
        const {
            getRoutesInfo,
        } = gortrans;
        assert.isFunction(getRoutesInfo);
    });

    it('calls proxy with correct url', () => {
        gortrans.getRoutesInfo();
        const args = request.getCall(0).args;
        request.resetHistory();
        assert.equal(args[0].url, config.PROXY_URL);
        assert.equal(args[0].headers.url, config.NSK_ROUTES);
        assert.equal(args[0].method, 'GET');
    });

    it('logs httpError', done => {
        const httpError = {};
        gortrans.getRoutesInfo()
            .then(res => {
                assert.isNull(res);
                sinon.assert.calledWith(logger.error, httpError);
                logger.error.resetHistory();
                done();
            })
            .catch(done);
        const args = request.getCall(0).args;
        request.resetHistory();
        const cb = args[1];
        cb(httpError);
    });

    it('logs when status !== 200', done => {
        const httpResponse = { statusCode: 500 };
        gortrans.getRoutesInfo()
            .then(res => {
                assert.isNull(res);
                const err = logger.error.getCall(0).args[0];
                assert.isTrue(/status code 500/.test(err));
                logger.error.resetHistory();
                done();
            })
            .catch(done);
        const args = request.getCall(0).args;
        request.resetHistory();
        const cb = args[1];
        cb(null, httpResponse, null);
    });

    it('reject when cannot parse the payload', done => {
        const httpResponse = { statusCode: 200 };
        const body  = 'aaa';
        gortrans.getRoutesInfo()
            .then((res) => {
                assert.isNull(res);
                const err = logger.error.getCall(0).args[0];
                assert.isTrue(/parse error/.test(err));
                logger.error.resetHistory();
                done();
            })
            .catch(done);
        const args = request.getCall(0).args;
        request.resetHistory();
        const cb = args[1];
        cb(null, httpResponse, body);
    });

    it('resolves parsed payload', done => {
        const httpResponse = { statusCode: 200 };
        const payload = { a: 'a' };
        const body  = JSON.stringify(payload);
        gortrans.getRoutesInfo()
            .then(result => {
                assert.deepEqual(result, payload);
                done();
            })
            .catch(() => done(helpers.badPlace()));
        const args = request.getCall(0).args;
        request.resetHistory();
        const cb = args[1];
        cb(null, httpResponse, body);
    });
});
