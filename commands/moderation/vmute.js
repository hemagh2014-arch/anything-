const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('إسكات عضو في الكول | Voice mute a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب | Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member || !member.voice.channel) {
            return interaction.reply({ content: '❌ هذا العضو ليس متواجداً في أي قناة صوتية.', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await member.voice.setMute(true, reason);
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🎙️ تم الإسكات الصوتي (Voice Mute)')
                .addFields(
                    { name: '👤 العضو', value: `${target}`, inline: true },
                    { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ أثناء محاولة الإسكات الصوتي.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

        const member = await message.guild.members.fetch(target.id).catch(() => null);
        if (!member || !member.voice.channel) return message.reply('❌ العضو غير متواجد في الكول.');

        const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

        try {
            await member.voice.setMute(true, reason);
            message.reply(`✅ تم إسكات ${target.tag} صوتياً.`);
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
