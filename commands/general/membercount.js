const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('عرض عدد أعضاء السيرفر بالتفصيل | Show detailed member count'),

    async execute(interaction) {
        const { guild } = interaction;
        const total = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = total - bots;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📊 Member Count: ${guild.name}`)
            .addFields(
                { name: '👥 Total Members', value: `\`${total}\``, inline: true },
                { name: '👤 Humans', value: `\`${humans}\``, inline: true },
                { name: '🤖 Bots', value: `\`${bots}\``, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message) {
        const { guild } = message;
        const total = guild.memberCount;
        // Note: in message commands, the cache might not be fully populated unless they have the intent
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = total - bots;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📊 Member Count`)
            .addFields(
                { name: 'Total', value: `\`${total}\``, inline: true },
                { name: 'Humans', value: `\`${humans}\``, inline: true },
                { name: 'Bots', value: `\`${bots}\``, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
