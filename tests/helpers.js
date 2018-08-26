module.exports = {
    badPlace() {
        throw new Error('Should not be here');
    },
    malformedJson: 'Unexpected token a in JSON at position 0',
};
