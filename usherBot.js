require('dotenv').config();

const discord = require ('discord.js');
const fs = require('fs');
const path = require('path');

let smartPath = path.resolve(process.cwd(), 'confucius.txt')
let smart = fs.readFileSync(smartPath).toString().split('\n');
// Remove empty lines
let empty = /^\s*$/;
smart = smart.filter(function(s) { return !s.match(empty); });

var client = new discord.Client();

const token = process.env.BOT_TOKEN;

client.on ("ready", () => {
    console.log ("ready!");

    client.user.setActivity ("Merry Madness");
});

const prefix = ".hey ";
client.on ("message", (message) => {

    if (message.author.bot) return;

    if (message.content.includes (prefix + "привет, бот")) {
        message.reply ('Привет!');
    }
    
    if (message.content.includes(prefix + 'скажи умное')) {
        message.reply(smart[Math.floor(Math.random() * smart.length)]);
    }
});

client.login (token);


client.on ("guildMemberAdd", member => {

    var role = member.guild.roles.find ("name", "Прохожие");
    member.addRole (role);
    member.guild.channels.get('627434071961632778').send('**' + member.user.username + '**, привет! <#603337113584402432>, чтобы узнать о нас больше и о том, что тебя ждёт!')

})

client.on ("guildMemberRemove", member => {
    member.guild.channels.get('409658506967384065').send('**' + member.user.username + '** покинул сервер')
    //
});
