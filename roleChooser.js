/*
Discord Role Chooser

Copyright (c) 2019 Sergey "SnakE" Gromov

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
Role chooser allows members of your Discord server to choose their roles
from a provided list. The roles are chosen using reactions to a special
message created by the chooser. Some features include:

- Custom message titles and footnotes
- Protection against adding unrelated reactions to the message. Any
  unrelated reactions are automatically removed

There can be only one chooser message per channel.

Module API:

function Chooser(client)

    Create an instance of the chooser.

    client - Discord client instance.

    Returns a Chooser instance.

Chooser API:

function setTitle(title)

    Set the message title.

    title - the title string.

function addChoice(icon, role, addMsg, removeMsg)

    Add a role choice.

    icon      - name of the emoji to use for this choice. The name must be
                either a single Unicode emoji character or the emoji code.
                You can determine this name by messaging a backslash
                followed by the emoji in Discord and then copying the result
                from the message.  E.g. "\:heart:" results in a single
                Unicode emoji "❤️", while a custom emoji might produce
                something like "<:cat:706936837247336568>".
    role      - an instance of discord.js Role object.
    addMsg    - a personal message which a user receives when they pick this
                role.
    removeMsg - a personal message which a user receives when they decline
                this role.

function addNote(note)

    Add a footnote to the chooser message. Multiple footnotes are separated
    by blank lines.

    note - a string to add as a note.

function enable(channel)

    Enable the chooser. Calling this creates the chooser message and starts
    listening for reactions. If the channel already contains a chooser
    message from a previous run this attaches to the existing message
    instead.

    Caveat: enable() attaches to an existing message even if it was created
    with a different configuration of roles/messages. It is recommended to
    delete the old chooser message when configuration changes.

    channel - an instance of discord.js TextChannel object.

    Returns a Promise of completion.
*/

const {MessageEmbed} = require('discord.js');

function Chooser() {
    let _client;
    const _choices = [];
    let _title = null;
    let _notes = "";
    let _chooserMessageId;

    async function createReactions(message) {
        if (message.partial) {
            message = await message.fetch();
        }
        await Promise.all(_choices.map(role => message.react(role.icon)));
    }

    async function createRoleSelector(channel) {
        console.log(`Creating a chooser in ${channel.name} of ${channel.guild.name}`);

        let text = '';
        for (const choice of _choices) {
            if (text) {
                text += '\n';
            }
            text += `${choice.icon} ${choice.role.name}`;
        }

        const embed = new MessageEmbed();
        embed.setDescription(text + _notes);
        if (_title) {
            embed.setTitle(_title);
        }

        try {
            const message = await channel.send(embed);
            await createReactions(message);
            _chooserMessageId = message.id;
        } catch (e) {
            detach();
            throw e;
        }
    }

    async function reactionAdd(reaction, user) {
        if (reaction.message.id != _chooserMessageId) return;
        if (user.id == _client.user.id) return;
        if (reaction.partial) reaction = await reaction.fetch();

        const choice = _choices.find(c => c.icon == reaction.emoji.name);

        // Remove any unrelated reactions.
        if (!choice) {
            await reaction.remove(user.id);
            return;
        }

        const member = await reaction.message.guild.members.fetch(user.id);

        if (member) {
            if (!member.roles.cache.has(choice.role.id)) {
                await Promise.all([
                    member.roles.add(choice.role),
                    member.send(choice.addMsg)]);
            }
        } else {
            await reaction.remove(user);
        }
    }

    function reactionAddHandler(reaction, user) {
        reactionAdd(reaction, user)
            .catch(reason => console.error('Error: reactionAddHandler:', reason, reaction, user));
    }

    async function reactionRemove(reaction, user) {
        if (reaction.message.id != _chooserMessageId) return;
        if (user.id == _client.user.id) return;
        if (reaction.partial) reaction = await reaction.fetch();

        const choice = _choices.find(c => c.icon == reaction.emoji.name);
        if (!choice) return;

        const member = await reaction.message.guild.members.fetch(user.id);

        if (member && member.roles.cache.has(choice.role.id)) {
            await Promise.all([
                member.roles.remove(choice.role),
                member.send(choice.removeMsg)]);
        }
    }

    function reactionRemoveHandler(reaction, user) {
        reactionRemove(reaction, user)
            .catch(reason => console.error('Error: reactionRemoveHandler:', reason, reaction, user));
    }

    function reactionRemoveAllHandler(message) {
        if (message.id != _chooserMessageId) return;
        createReactions(message)
            .catch(reason => console.error('Error: reactionRemoveAllHandler:', reason, message));
    }

    function setTitle(title) {
        if (_client) {
            throw 'Role chooser already enabled';
        }
        _title = title;
    }

    function addChoice(icon, role, addMsg, removeMsg) {
        if (_client) {
            throw 'Role chooser already enabled';
        }
        if (_choices.length && _choices[0].role.guild != role.guild) {
            throw 'All roles must be from the same guild';
        }
        for (const choice of _choices) {
            if (choice.role == role) {
                throw 'Roles must not repeat';
            }
            if (choice.icon == icon) {
                throw 'Icons must not repeat';
            }
        }
        _choices.push({icon: icon, role: role, addMsg: addMsg, removeMsg: removeMsg});
    }

    function addNote(note) {
        if (_client) {
            throw 'Role chooser already enabled';
        }
        _notes += '\n\n' + note;
    }

    function attach(client) {
        if (_client) {
            throw "Already attached";
        }
        _client = client;
        _client.on('messageReactionAdd', reactionAddHandler);
        _client.on('messageReactionRemove', reactionRemoveHandler);
        _client.on('messageReactionRemoveAll', reactionRemoveAllHandler);
    }

    function detach() {
        if (_client) return;
        _client.off('messageReactionAdd', reactionAddHandler);
        _client.off('messageReactionRemove', reactionRemoveHandler);
        _client.off('messageReactionRemoveAll', reactionRemoveAllHandler);
        _client = null;
    }

    async function enable(channel) {
        if (_client) {
            throw 'Role chooser already enabled';
        }
        if (!_choices.length) {
            throw 'The choice list is empty';
        }
        if (_choices[0].role.guild != channel.guild) {
            throw 'Channel and roles must be from the same guild';
        }

        attach(channel.client);

        const messages = await channel.messages.fetch();
        const chooserMessage = messages.find(msg => msg.author == _client.user && msg.embeds.length);
        if (chooserMessage) {
            _chooserMessageId = chooserMessage.id;
        } else {
            await createRoleSelector(channel);
        }
    }

    return {
        setTitle: setTitle,
        addChoice: addChoice,
        addNote: addNote,
        enable: enable,
    };
}

module.exports = {
    Chooser: Chooser,
};
