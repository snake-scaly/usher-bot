require('dotenv').config()

require("http").createServer(async (req,res) => { res.statusCode = 200; res.write("ok"); res.end(); }).listen(3000, () => console.log("Now listening on port 3000"));

const discord = require ('discord.js');

var client = new discord.Client();

const token = process.env.BOT_TOKEN;

client.on ("ready", () => {
    console.log ("ready!");

    client.user.setActivity ("Merry Madness");
});

const prefix = "!s ";
client.on ("message", (message) => {

    if (message.author.bot) return;

    if (message.content.includes (prefix + "привет, бот")) {
        message.reply ('Привет!');
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
