const sinon = require('sinon');
const { assert } = require('chai');

const createData = require('../../src/lib/services/data');
const gortrans = require('../mocks/gortrans-core-mock')();
const storage = require('../mocks/storage-mock')();
const logger = require('../mocks/logger-mock')();
const date = require('../mocks/date-mock')();
const config = {
    DATA_VALID_FOR: 1,
};
const data = createData({
    config,
    date,
    gortrans,
    logger,
    storage,
});

describe('Data service', () => {
    it('initializes', () => {
        const {
            getRoutesInfo,
        } = data;
        assert.isFunction(getRoutesInfo);
    });

    describe('getTrassInfo', () => {
        it('storage: not exists; gortrans: failed -> null', async () => {
            storage.updateResults([ null, null ]);
            gortrans.updateResult(null);
            const result = await data.getRoutesInfo();
            assert.isNull(result);
        });

        it('storage: not exists; gortrans: success -> update & result from gortrans',
            async () => {
                // const now = 10;
                // const routesInfo = { a: 'a' };
                // const expectedWrapper = {
                //     routesInfo,
                //     timestamp: now,
                // };
                // date.setNow(now);
                // storage.updateResults([null, null]);
                // gortrans.updateResult(routesInfo);
                // const result = await data.getRoutesInfo();
                // sinon.assert.calledWith(storage.setRoutesInfo, sinon.match(expectedWrapper));
                // storage.setRoutesInfo.resetHistory();
                // assert.deepEqual(result, expectedWrapper);
            }
        );

        it('storage: expired; gortrans: failed -> old storage', async () => {
            // const now = 10;
            // const routesInfo = { a: 'a' };
            // const expectedWrapper = {
            //     routesInfo,
            //     timestamp: now,
            // };
            // date.setNow(now);
            // storage.updateResults([null, expectedWrapper]);
            // gortrans.updateResult(null);
            // const result = await data.getRoutesInfo();
            // sinon.assert.notCalled(storage.setRoutesInfo);
            // storage.setRoutesInfo.resetHistory();
            // assert.deepEqual(result, expectedWrapper);
        });

        it('storage: expired; gortrans: not changed -> old storage', async () => {
            // const now = 10;
            // const routesInfo = { a: 'a' };
            // const expectedWrapper = {
            //     routesInfo,
            //     timestamp: now,
            // };
            // date.setNow(now);
            // storage.updateResults([null, expectedWrapper]);
            // gortrans.updateResult(routesInfo);
            // const result = await data.getRoutesInfo();
            // sinon.assert.notCalled(storage.setRoutesInfo);
            // storage.setRoutesInfo.resetHistory();
            // assert.deepEqual(result, expectedWrapper);
        });

        it('storage: expired; gortrans: changed -> update & result from gortrans', async () => {
            // const now = 10;
            // const newNow = 100;
            // date.setNow(newNow);
            // const routesInfo = { a: 'a' };
            // const newRoutesInfo = { a: 'a' };
            // const oldWrapper = {
            //     routesInfo,
            //     timestamp: now,
            // };
            // const expectedWrapper = {
            //     routesInfo: newRoutesInfo,
            //     timestamp: newNow,
            // };
            // storage.updateResults([null, oldWrapper]);
            // gortrans.updateResult(newRoutesInfo);
            // const result = await data.getRoutesInfo();
            // sinon.assert.calledWith(storage.setRoutesInfo, sinon.match(expectedWrapper));
            // storage.setRoutesInfo.resetHistory();
            // assert.deepEqual(result, expectedWrapper);
        });
    });

    describe('getRoutesInfo', () => {
        it('storage: not exists; gortrans: failed -> null', async () => {
            storage.updateResults([ null, null ]);
            gortrans.updateResult(null);
            const result = await data.getRoutesInfo();
            assert.isNull(result);
        });

        it('storage: not exists; gortrans: success -> update & result from gortrans',
            async () => {
                const now = 10;
                const routesInfo = { a: 'a' };
                const expectedWrapper = {
                    routesInfo,
                    timestamp: now,
                };
                date.setNow(now);
                storage.updateResults([ null, null ]);
                gortrans.updateResult(routesInfo);
                const result = await data.getRoutesInfo();
                sinon.assert.calledWith(storage.setRoutesInfo, sinon.match(expectedWrapper));
                storage.setRoutesInfo.resetHistory();
                assert.deepEqual(result, expectedWrapper);
            }
        );

        it('storage: expired; gortrans: failed -> old storage', async () => {
            const now = 10;
            const routesInfo = { a: 'a' };
            const expectedWrapper = {
                routesInfo,
                timestamp: now,
            };
            date.setNow(now);
            storage.updateResults([ null, expectedWrapper ]);
            gortrans.updateResult(null);
            const result = await data.getRoutesInfo();
            sinon.assert.notCalled(storage.setRoutesInfo);
            storage.setRoutesInfo.resetHistory();
            assert.deepEqual(result, expectedWrapper);
        });

        it('storage: expired; gortrans: not changed -> old storage', async () => {
            const now = 10;
            const routesInfo = { a: 'a' };
            const expectedWrapper = {
                routesInfo,
                timestamp: now,
            };
            date.setNow(now);
            storage.updateResults([ null, expectedWrapper ]);
            gortrans.updateResult(routesInfo);
            const result = await data.getRoutesInfo();
            sinon.assert.notCalled(storage.setRoutesInfo);
            storage.setRoutesInfo.resetHistory();
            assert.deepEqual(result, expectedWrapper);
        });

        it('storage: expired; gortrans: changed -> update & result from gortrans', async () => {
            const now = 10;
            const newNow = 100;
            date.setNow(newNow);
            const routesInfo = { a: 'a' };
            const newRoutesInfo = { a: 'a' };
            const oldWrapper = {
                routesInfo,
                timestamp: now,
            };
            const expectedWrapper = {
                routesInfo: newRoutesInfo,
                timestamp: newNow,
            };
            storage.updateResults([ null, oldWrapper ]);
            gortrans.updateResult(newRoutesInfo);
            const result = await data.getRoutesInfo();
            sinon.assert.calledWith(storage.setRoutesInfo, sinon.match(expectedWrapper));
            storage.setRoutesInfo.resetHistory();
            assert.deepEqual(result, expectedWrapper);
        });
    });
});
