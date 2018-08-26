const sinon = require('sinon');

module.exports = () => {
    let existsFlag = () => false;
    let readFileArgs = [null, null];

    const exists = (path, cb) => {
        cb(existsFlag(path));
    };

    const readFile = (path, cb) => {
        cb(...readFileArgs);
    };

    const writeFile = (path, data, options, cb) => {
        cb(null);
    };

    const setExists = (existsCheck) => {
        existsFlag = existsCheck;
    };

    const setReadFileCbArgs = (...args) => {
        readFileArgs = args;
    };

    return {
        exists: sinon.fake(exists),
        readFile: sinon.fake(readFile),
        setExists,
        setReadFileCbArgs,
        writeFile: sinon.fake(writeFile),
    };
};
