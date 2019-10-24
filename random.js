// Random numbers generator.

const crypto = require('crypto');

function random() {
    let [a, b, c] = crypto.randomBytes(3);
    // No idea. Removing this intermediate variable seems to cause numbers to repeat. Rounding?
    let r = (a + (b << 8) + (c << 16)) / (1 << 24);
    return r;
}

module.exports = {random: random};
