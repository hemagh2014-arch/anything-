const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');

function loadWarnings() {
    try {
        if (!fs.existsSync(path.dirname(warningsPath))) {
            fs.mkdirSync(path.dirname(warningsPath), { recursive: true });
        }
        if (!fs.existsSync(warningsPath)) {
            fs.writeFileSync(warningsPath, JSON.stringify({ guilds: {} }, null, 2));
            return { guilds: {} };
        }
        const data = fs.readFileSync(warningsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading warnings:', error);
        return { guilds: {} };
    }
}

function saveWarnings(data) {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

function addWarning(guildId, userId, moderatorId, reason) {
    const data = loadWarnings();
    if (!data.guilds[guildId]) data.guilds[guildId] = {};
    if (!data.guilds[guildId][userId]) data.guilds[guildId][userId] = [];

    const warning = {
        id: Date.now().toString(),
        moderatorId,
        reason,
        timestamp: new Date().toISOString()
    };

    data.guilds[guildId][userId].push(warning);
    saveWarnings(data);
    return data.guilds[guildId][userId].length;
}

function getWarnings(guildId, userId) {
    const data = loadWarnings();
    return (data.guilds[guildId] && data.guilds[guildId][userId]) || [];
}

function clearWarnings(guildId, userId) {
    const data = loadWarnings();
    if (data.guilds[guildId] && data.guilds[guildId][userId]) {
        const count = data.guilds[guildId][userId].length;
        delete data.guilds[guildId][userId];
        saveWarnings(data);
        return count;
    }
    return 0;
}

module.exports = {
    addWarning,
    getWarnings,
    clearWarnings
};
