const { assert } = require('chai');

const helpers = require('../helpers');
const utils = require('../../src/lib/utils');
const createStorage = require('../../src/lib/services/storage');
const fs = require('../mocks/fs-mock')();
const logger = require('../mocks/logger-mock')();

const correctFile = 'correctFile';
const dataDir = 'dataDir';
const config = {
    DATA_DIR: dataDir,
    DATA_ROUTES_INFO_FILE: correctFile,
};
const storage = createStorage({
    config,
    fs,
    logger,
    utils,
});
const transKey = 'key';
const transFileName = utils.getTrassStorageFileName(transKey, config);

describe('Storage service', () => {
    it('initializes', () => {
        const {
            getTrassInfo,
            getRoutesInfo,
            setTrassInfo,
            setRoutesInfo,
        } = storage;
        assert.isFunction(getRoutesInfo);
        assert.isFunction(setRoutesInfo);
        assert.isFunction(getTrassInfo);
        assert.isFunction(setTrassInfo);
    });

    describe('route info', () => {
        it('returns null if file does not exist', async () => {
            fs.setExists(() => false);
            const trassInfo = await storage.getTrassInfo(transKey);
            assert.isNull(trassInfo);
        });

        it('returns route info if file exists and is correct', async () => {
            const _trassInfo = { a: 'a' };
            fs.setExists(path => path === transFileName);
            fs.setReadFileCbArgs(null, JSON.stringify(_trassInfo));
            const routesInfo = await storage.getTrassInfo(transKey);
            assert.deepEqual(routesInfo, _trassInfo);
        });

        it('rejects file read error', async () => {
            const readErr = {};
            fs.setExists(path => path === transFileName);
            fs.setReadFileCbArgs(readErr, null);
            try {
                await storage.getTrassInfo(transKey);
                helpers.badPlace();
            } catch (err) {
                assert.equal(readErr, err);
            }
        });

        it('rejects malformed JSON', async () => {
            fs.setExists(path => path === transFileName);
            fs.setReadFileCbArgs(null, 'aaa');
            try {
                await storage.getTrassInfo(transKey);
                helpers.badPlace();
            } catch (err) {
                assert.equal(err.message, helpers.malformedJson);
            }
        });
    });

    describe('routes info', () => {
        it('returns null if file does not exist', async () => {
            fs.setExists(() => false);
            const routesInfo = await storage.getRoutesInfo();
            assert.isNull(routesInfo);
        });

        it('returns routes info if file exists and is correct', async () => {
            const _routesInfo = { a: 'a' };
            fs.setExists(path => path === correctFile);
            fs.setReadFileCbArgs(null, JSON.stringify(_routesInfo));
            const routesInfo = await storage.getRoutesInfo();
            assert.deepEqual(routesInfo, _routesInfo);
        });

        it('rejects file read error', async () => {
            const readErr = {};
            fs.setExists(path => path === correctFile);
            fs.setReadFileCbArgs(readErr, null);
            try {
                await storage.getRoutesInfo();
                helpers.badPlace();
            } catch (err) {
                assert.equal(readErr, err);
            }
        });

        it('rejects malformed JSON', async () => {
            fs.setExists(path => path === correctFile);
            fs.setReadFileCbArgs(null, 'aaa');
            try {
                await storage.getRoutesInfo();
                helpers.badPlace();
            } catch (err) {
                assert.equal(err.message, helpers.malformedJson);
            }
        });
    });
});
