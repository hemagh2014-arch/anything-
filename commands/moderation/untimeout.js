const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('إزالة الإسكات المؤقت عن عضو | Remove timeout from a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب | Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', flags: [MessageFlags.Ephemeral] });
        }

        if (!member.communicationDisabledUntilTimestamp) {
            return interaction.reply({ content: '❌ هذا العضو ليس لديه تايم آوت أصلاً.', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await member.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('✅ تم إزالة الإسكات المؤقت (Timeout Removal)')
                .addFields(
                    { name: '👤 العضو', value: `${targetUser} (${targetUser.id})`, inline: true },
                    { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Untimeout error:', error);
            interaction.reply({ content: '❌ حدث خطأ أثناء إزالة التايم آوت.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ ليس لديك صلاحية.');
        }

        const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!targetUser) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return message.reply('❌ العضو غير موجود.');

        if (!member.communicationDisabledUntilTimestamp) {
            return message.reply('❌ هذا العضو ليس لديه تايم آوت.');
        }

        const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

        try {
            await member.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('✅ تم إزالة الإسكات المؤقت')
                .addFields(
                    { name: '👤 العضو', value: `${targetUser}`, inline: true },
                    { name: '🛡️ بواسطة', value: message.author.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Untimeout error:', error);
            message.reply('❌ حدث خطأ أثناء إزالة التايم آوت.');
        }
    }
};
