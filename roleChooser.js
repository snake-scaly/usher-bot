const {RichEmbed} = require('discord.js');

const choices = [
    {
        icon: '🛡',
        roleId: '603881801433219073',
        added: 'Вам добавлена роль танка. Стойте и терпите.',
        removed: 'Вы отказались от роли танка. Чтож, никто не любит, когда его бъют.',
    },
    {
        icon: '🏹',
        roleId: '603882245400428554',
        added: 'Вам добавлена роль бойца. Извольте драться.',
        removed: 'Вы отказались от роли бойца. Драться — не чай пить.',
    },
    {
        icon: '💉',
        roleId: '603881325052690432',
        added: 'Вам добавлена роль целителя. Не забудте про баффы.',
        removed: 'Вы отказались от роли целителя. Личное кладбище из бывших пациентов не помещается на заднем дворе?',
    },
    {
        icon: '⚒',
        roleId: '605017948079521803',
        added: 'Вам добавлена роль крафтера. Мастерские открыты.',
        removed: 'Вы отказались от роли крафтера. Ну и правильно. Никто не ценит талант.',
    },
    {
        icon: '⚔',
        roleId: '607805418189750272',
        added: 'Вам добавлена роль ПВП. Пора на войну.',
        removed: 'Вы отказались от роли ПВП. Война проиграна.',
    },
    {
        icon: '🗡',
        roleId: '635143633150148611',
        added: 'Вам добавлена роль ПВЕ. Пора истреблять монстров.',
        removed: 'Вы отказались от роли ПВЕ. Теперь чудовища поработят мир!',
    },
    {
        icon: '👥',
        roleId: '607805285280645132',
        added: 'Вам добавлена роль РП. Добро пожаловать в Нирн.',
        removed: 'Вы отказались от роли РП. Добро пожаловать в реальность.',
    },

    /*
    {
        icon: '😂',
        roleId: '635097767898906634',
        added: 'Шарики, как много шариков!',
        removed: 'Какие такие шарики?',
    },
    {
        icon: '😢',
        roleId: '635097891521822721',
        added: 'Исполнен печалью.',
        removed: 'Вроде и не грустно...',
    },
    */
];

const bootstrapList = [
    {guild: '409658506434838529', channel: '627434071961632778'}, // Merry Madness
    //{guild: '634791890251677717', channel: '635184992711999489'}, // Serpentary
];

var botClient;

function populateRoles(guild) {
    for (const c of choices) {
        var role = guild.roles.get(c.roleId);
        if (role) {
            c['role'] = role;
            c['name'] = role.name;
        }
    }
}

function findChoiceByIcon(icon) {
    for (const c of choices) {
        if (c.icon == icon) return c;
    }
}

function createReactions(message) {
    for (const role of choices) message.react(role.icon);
}

function createRoleSelector(channel) {
    console.log(`Creating a chooser in ${channel.name} of ${channel.guild.name}`);

    var text = '';
    for (const role of choices) {
        if (text) text += '\n';
        text += `${role.icon} ${role.name}`;
    }

    var embed = new RichEmbed()
        .setTitle('Пожалуйста, укажите свои роли')
        .setDescription(text);

    channel.send(embed)
        .then(createReactions);
}

function isChooserMessage(message) {
    return message.author == botClient.user && message.embeds.length != 0;
}

function prefetchChooserMessages(messages) {
    for (const entry of messages) {
        if (isChooserMessage(entry[1])) {
            return true;
        }
    }
    return false;
}

function bootstrap(client) {
    botClient = client;
    for (const entry of bootstrapList) {
        var guild = client.guilds.get(entry.guild);
        if (!guild) {
            console.error(`Guild not found: ${entry.guild}`);
            return;
        }

        var channel = guild.channels.get(entry.channel);
        if (!channel) {
            console.error(`Channel ${entry.channel} not found in guild ${guild.name}`);
            return;
        }

        populateRoles(guild);

        channel.fetchMessages()
            .then(messages => {
                if (!prefetchChooserMessages(messages)) createRoleSelector(channel);
            });
    }
}

function reactionAdd(reaction, user) {
    if (user.bot) return;
    if (!isChooserMessage(reaction.message)) return;

    var choice = findChoiceByIcon(reaction.emoji.name);

    // Remove any unrelated reactions.
    if (!choice) {
        reaction.remove(user);
        return;
    }

    reaction.message.guild.fetchMember(user)
        .then(member => {
            if (member) {
                if (!member.roles.has(choice.role.id)) {
                    member.addRole(choice.role);
                    member.send(choice.added);
                }
            } else {
                reaction.remove(user);
            }
        });
}

function reactionRemove(reaction, user) {
    if (user.bot) return;
    if (!isChooserMessage(reaction.message)) return;

    var choice = findChoiceByIcon(reaction.emoji.name);
    if (!choice) return;

    reaction.message.guild.fetchMember(user)
        .then(member => {
            if (member && member.roles.has(choice.role.id)) {
                member.removeRole(choice.role);
                member.send(choice.removed);
            }
        });
}

function reactionRemoveAll(message) {
    if (user.bot) return;
    if (!isChooserMessage(reaction.message)) return;
    createReactions(message);
}

module.exports = {
    reactionAdd: reactionAdd,
    reactionRemove: reactionRemove,
    reactionRemoveAll: reactionRemoveAll,
    bootstrap: bootstrap,
};
