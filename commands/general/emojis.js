const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('عرض قائمة إيموجيات السيرفر | List server emojis'),

    async execute(interaction) {
        const emojis = interaction.guild.emojis.cache.map(e => e.toString()).join(' ') || 'None';

        if (emojis.length > 2000) {
            return interaction.reply({ content: '❌ قائمة الإيموجيات طويلة جداً.', flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`😀 Emojis List - ${interaction.guild.name}`)
            .setDescription(emojis)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const emojis = message.guild.emojis.cache.map(e => e.toString()).join(' ') || 'None';

        if (emojis.length > 2000) return message.reply('❌ القائمة طويلة جداً.');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('😀 Emojis List')
            .setDescription(emojis)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
