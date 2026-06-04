const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('عرض معلومات البوت التقنية | Show bot technical information'),

    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🤖 Bot Statistics')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: 'Developer', value: '[Mahmoud]', inline: true },
                { name: 'Language', value: 'JavaScript', inline: true },
                { name: 'Library', value: `discord.js v${version}`, inline: true },
                { name: 'Uptime', value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``, inline: true },
                { name: 'Memory', value: `\`${memoryUsage} MB\``, inline: true },
                { name: 'Servers', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
                { name: 'Users', value: `\`${interaction.client.users.cache.size}\``, inline: true },
                { name: 'OS', value: `\`${os.platform()} ${os.arch()}\``, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🤖 Bot Statistics')
            .addFields(
                { name: 'Uptime', value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``, inline: true },
                { name: 'Servers', value: `\`${message.client.guilds.cache.size}\``, inline: true },
                { name: 'Library', value: 'discord.js', inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
