const broadcastRoles = [
    '664724324581769216', // Рейдеры@Serpentary
    '656819890082152450', // Рейдеры@MerryMadness
];

function doBroadcast(role, message) {
    for (const [snowflake, member] of role.members) {
        member.send(message.cleanContent)
            .catch(reason => {
                console.error(
                    'Failed to send message', message.cleanContent,
                    'to member', member,
                    ':', reason);
            });
    }
}

// Broadcast the message to all members of mentioned broadcast roles.
function broadcast(message) {
    for (const [snowflake, role] of message.mentions.roles) {
        if (broadcastRoles.includes(snowflake)) {
            doBroadcast(role, message);
        }
    }
}

module.exports = {broadcast: broadcast};
