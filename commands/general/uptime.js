const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('عرض مدة تشغيل البوت | Show bot uptime'),

    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⏲️ Bot Uptime')
            .setDescription(`البوت يعمل منذ:\n**${days}** يوم، **${hours}** ساعة، **${minutes}** دقيقة، **${seconds}** ثانية`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        message.reply(`⏲️ البوت يعمل منذ: **${days}d ${hours}h ${minutes}m ${seconds}s**`);
    }
};
