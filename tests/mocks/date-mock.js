let now = 0;

module.exports = () => {
    return {
        now() {
            return now;
        },
        setNow(_now) {
            now = _now;
        },
    };
};
