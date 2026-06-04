const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('إزالة الإسكات الصوتي عن عضو | Voice unmute a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member || !member.voice.channel) {
            return interaction.reply({ content: '❌ هذا العضو ليس متواجداً في أي قناة صوتية.', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await member.voice.setMute(false, 'Voice unmute');
            await interaction.reply(`✅ تم إلغاء الإسكات الصوتي عن ${target.tag}.`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

        const member = await message.guild.members.fetch(target.id).catch(() => null);
        if (!member || !member.voice.channel) return message.reply('❌ العضو غير متواجد في الكول.');

        try {
            await member.voice.setMute(false);
            message.reply(`✅ تم إلغاء الإسكات الصوتي عن ${target.tag}.`);
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
