const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('رابط دعوة البوت | Bot invite link'),

    async execute(interaction) {
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔗 انقر لإضافة البوت | Click to Invite')
            .setDescription('شكراً لاستخدامك البوت! يمكنك إضافته لسيرفرك من الرابط أدناه.\nThank you for using the bot! You can add it to your server using the link below.')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setURL(inviteLink)
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async executeMessage(message) {
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${message.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🔗 Invite Link')
            .setDescription(`[Click Here](${inviteLink})`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
