const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('عرض قائمة رتب السيرفر | List server roles'),

    async execute(interaction) {
        const roles = interaction.guild.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => r)
            .join(', ') || 'None';

        if (roles.length > 2000) {
            return interaction.reply({ content: '❌ قائمة الرتب طويلة جداً بحيث لا يمكن عرضها في رسالة واحدة.', flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🎭 Roles List - ${interaction.guild.name}`)
            .setDescription(roles)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const roles = message.guild.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => r)
            .join(', ') || 'None';

        if (roles.length > 2000) return message.reply('❌ القائمة طويلة جداً.');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎭 Roles List')
            .setDescription(roles)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
