// Nonsense generator.
//
// Given a list of tokens, it generates a sequence where tokens follow
// one another with the same probability as in the original list but
// in a different order. E.g. if the input list is some literature split
// by words the result will be nonsense but in the same style and using
// the same vocabulary as the original.

const {random} = require('./random.js');

function checkStop(t, stop) {
    if (typeof(stop.test) == 'function') {
        return stop.test(t);
    }
    return t === stop;
}

// Generate nonsense.
// tokens: a list of tokens. Can be a string in which case each letter
//   is considered to be a separate token
// coherence: number of tokens to match before the new token. The larger
//   this number is, the more output will resemble the original sequence.
//   2 is a good number
// stop: token to stop at, e.g. a period, to make the output consist
//   of complete sentences. Can be a regular expression.
// min: minimum number of tokens in the output. Stop tokens are ignored
//   before reaching this amount
// max: maximum number of tokens in the output. Output is truncated even
//   if a stop token isn't reached
function nonsense(tokens, coherence, stop, min, max) {
    const history = [];
    const output = [];
    
    while (output.length < max) {
        let start = Math.floor(random() * tokens.length);
        let pos = start;
        let h = 0;

        while (h < history.length) {
            if (tokens[pos] == history[h]) {
                h++;
            } else {
                h = 0;
            }

            pos++;

            if (pos == tokens.length) {
                pos = 0;
            }
            if (pos == start) {
                // There is no token with the required history. Use the token
                // at the originally chosen random position.
                break;
            }
        }

        // The history matches, we've found the new token.
        const t = tokens[pos];

        output.push(t);

        history.push(t);
        if (history.length > coherence) {
            history.shift();
        }

        if (output.length >= min && checkStop(t, stop)) {
            break;
        }
    }

    return output;
}

module.exports = {nonsense: nonsense};
