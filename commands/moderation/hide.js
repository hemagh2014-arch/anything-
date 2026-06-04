const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('إخفاء القناة الحالية عن الجميع | Hide current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                ViewChannel: false
            });
            await interaction.reply({ content: '🔒 تم إخفاء القناة عن الجميع بنجاح.' });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ أثناء محاولة إخفاء القناة.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: false
            });
            message.reply('🔒 تم إخفاء القناة بنجاح.');
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
