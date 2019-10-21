require('dotenv').config();

const discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const roleChooser = require('./roleChooser.js');
const XRegExp = require('xregexp');
const crypto = require('crypto');

// 'snowflake' NAME '=' NUMBER
const snowflakeRegex = /\s*snowflake\s+([^\s=]+)\s*=\s*(\d*)/;

// Parse a snowflake symbol definition. The definition has the form
// 'snowflake' NAME '=' NUMBER
// These must be the first tokens on the line. Everything after the NUMBER is ignored.
// Returns an object with 'name' and 'value' properties, or undefined if the line is not
// a snowflake definition.
function parseSnowflake(line) {
    var m = line.match(snowflakeRegex)
    if (!m) return;
    if (!m[2]) {
        console.warn(line + ': bad snowflake value');
    }
    return {name:m[1], value:m[2]};
}

// Replace symbolic references with numeric snowflake IDs.
function fixMentions(line, snowflakes) {
    // '<#' NAME '>' or '<@' NAME '>'
    const mentionRegex = /<[#@]([^>]+)>/g;
    while (m = mentionRegex.exec(line)) {
        var name = m[1];
        var id = snowflakes[name];
        if (id) {
            var first = m.index + 2;
            var last = first + name.length;
            line = line.substring(0, first) + id + line.substring(last);
            mentionRegex.lastIndex += id.length - name.length;
        }
    }
    return line;
}

// Read replies from a text file.
//
// If separator is specified, the replies are considered multiline separated
// by lines matching the separator exactly. Otherwise it is considered to be
// one reply per line.
//
// The file may contain symbolic mentions of the form <#NAME> or <@NAME>. Each
// name must be defined in the same file using the snowflake directive:
// snowflake NAME = NUMBER
// Each snowflake directive must be on a separate line.
function readReplies(name, separator=undefined) {
    const filePath = path.resolve(process.cwd(), name);
    const lines = fs.readFileSync(filePath).toString().split('\n');
    const snowflakes = {};
    const replies = [];
    var reply = '';

    for (const l of lines) {
        var sf = parseSnowflake(l);
        if (sf) {
            // A snowflake takes the whole line, there can't be anything else there.
            snowflakes[sf.name] = sf.value;
            continue;
        }

        if (separator) {
            if (l == separator) {
                if (reply) {
                    replies.push(reply);
                    reply = '';
                }
            } else {
                if (reply) reply += '\n';
                reply += fixMentions(l, snowflakes);
            }
        } else if (l.trim()) {
            replies.push(fixMentions(l, snowflakes));
        }
    }

    if (reply) replies.push(reply);
    return replies;
};

const notAWord = '(?:\\P{L}|^|$)';

const greetSureRegex = XRegExp('^-эй,\\s+привет,\\s+бот', 'i');
const guardSureRegex = XRegExp('^-эй,\\s+пушистик!', 'i');
const smartSureRegex = XRegExp('^-эй,\\s+скажи\\s+умное', 'i');
const confusedRegex = XRegExp(`^-эй${notAWord}`, 'i');

const guardRegex = XRegExp(`${notAWord}(?:страж|полиц)`, 'i');
const smartRegex = XRegExp(`${notAWord}ум(?:а|у|е|ом)?${notAWord}|${notAWord}(?:за)?умн|мысе?л`, 'i');
const sheoRegex = XRegExp('сыр|шео', 'i');
const jokeRegex = XRegExp(`анекдот|штирлиц|${notAWord}шут`, 'i');

// Guess the message theme.
// Returns an object with two values:
//   'theme': one of 'greet', 'smart', 'guard', 'sheo', 'confused', 'joke', undefined
//   'certainty': a number from 0 to 1 specifying how certain the algorithm is that
//     the user actually addressed the bot
function guessTheme(msg) {
    msg = msg.trim();
    if (greetSureRegex.test(msg)) return {theme:'greet', certainty:1};
    if (guardSureRegex.test(msg)) return {theme:'guard', certainty:1};
    if (smartSureRegex.test(msg)) return {theme:'smart', certainty:1};
    if (guardRegex.test(msg)) return {theme:'guard', certainty:0.5};
    if (smartRegex.test(msg)) return {theme:'smart', certainty:0.5};
    if (sheoRegex.test(msg)) return {theme:'sheo', certainty:0.5};
    if (jokeRegex.test(msg)) return {theme:'joke', certainty:0.5};
    if (confusedRegex.test(msg)) return {theme:'confused', certainty:1};
    return {certainty:0};
}

function cryptoRandom() {
    var a, b, c;
    [a, b, c] = crypto.randomBytes(3);
    // No idea. Removing this intermediate variable seems to cause numbers to repeat. Rounding?
    var r = (a + (b << 8) + (c << 16)) / (1 << 24);
    return r;
}

function randomMessage(messages) {
    return messages[Math.floor(cryptoRandom() * messages.length)];
}

const guard = readReplies('guard.txt');
const smart = readReplies('confucius.txt');
const sheo = readReplies('sheo.txt');
const confused = readReplies('confused.txt');
const joke = readReplies('schtirlitz.txt', '№');

var client = new discord.Client();

const token = process.env.BOT_TOKEN;

client.on ("ready", () => {
    client.user.setActivity ("Merry Madness");
    roleChooser.bootstrap(client);
    console.log("ready!");
});

client.on ("message", (message) => {

    if (message.author.bot) return;

    const guess = guessTheme(message.content);
    if (guess.certainty < 0.1) return;

    if (guess.theme == 'greet') {
        message.reply ('привет!');
    } else if (guess.theme == 'guard') {
        message.channel.send(randomMessage(guard));
    } else if (guess.theme == 'smart') {
        message.channel.send(randomMessage(smart));
    } else if (guess.theme == 'sheo') {
        message.channel.send(randomMessage(sheo));
    } else if (guess.theme == 'confused') {
        message.reply(randomMessage(confused));
    } else if (guess.theme == 'joke') {
        message.channel.send(randomMessage(joke));
    }
});

client.on ("guildMemberAdd", member => {

    var role = member.guild.roles.find ("name", "Прохожие");
    member.addRole (role);
    member.guild.channels.get('627434071961632778').send('**' + member.user.username + '**, привет! <#603337113584402432>, чтобы узнать о нас больше и о том, что тебя ждёт!')

})

client.on ("guildMemberRemove", member => {
    member.guild.channels.get('409658506967384065').send('**' + member.user.username + '** покинул сервер')
    //
});

client.on('messageReactionAdd', roleChooser.reactionAdd);
client.on('messageReactionRemove', roleChooser.reactionRemove);
client.on('messageReactionRemoveAll', roleChooser.reactionRemoveAll);

client.login(token);
