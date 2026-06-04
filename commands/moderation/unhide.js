const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unhide')
        .setDescription('إظهار القناة الحالية للجميع | Unhide current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                ViewChannel: true
            });
            await interaction.reply({ content: '🔓 تم إظهار القناة للجميع بنجاح.' });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ أثناء محاولة إظهار القناة.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: true
            });
            message.reply('🔓 تم إظهار القناة بنجاح.');
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
