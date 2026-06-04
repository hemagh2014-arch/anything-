const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إسكات عضو لفترة محددة | Timeout a user for a specific duration')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('المدة (10m, 1h, 1d) | Duration').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب | Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ لم أستطع العثor على هذا العضو في السيرفر.', flags: [MessageFlags.Ephemeral] });
        }

        if (!member.moderatable) {
            return interaction.reply({ content: '❌ لا يمكنني تطبيق التايم آوت على هذا العضو (ربما رتبته أعلى مني أو لدي صلاحيات محدودة).', flags: [MessageFlags.Ephemeral] });
        }

        const durationMs = ms(durationStr);
        if (!durationMs || durationMs < 10000 || durationMs > 2419200000) {
            return interaction.reply({ content: '❌ مدة غير صالحة! يرجى استخدام صيغة مثل (10m, 1h, 1d). الحد الأقصى للجلسة الواحدة هو 28 يوم.', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await member.timeout(durationMs, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('⏳ تم تطبيق الإسكات المؤقت (Timeout)')
                .addFields(
                    { name: '👤 العضو', value: `${targetUser} (${targetUser.id})`, inline: true },
                    { name: '⏱️ المدة', value: durationStr, inline: true },
                    { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Timeout error:', error);
            interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تطبيق التايم آوت.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ ليس لديك صلاحية لإجراء التايم آوت.');
        }

        if (args.length < 2) {
            return message.reply('❌ الاستخدام الصحيح: `+timeout @عضو المدة سبب(اختياري)`\nمثال: `+timeout @user 1h سبام`');
        }

        const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!targetUser) return message.reply('❌ يرجى منشن عضو أو كتابة الأيدي الخاص به.');

        const durationStr = args[1];
        const reason = args.slice(2).join(' ') || 'لا يوجد سبب | No reason provided';
        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) return message.reply('❌ العضو غير موجود في السيرفر.');
        if (!member.moderatable) return message.reply('❌ لا يمكنني تطبيق التايم آوت على هذا العضو.');

        const durationMs = ms(durationStr);
        if (!durationMs || durationMs < 10000 || durationMs > 2419200000) {
            return message.reply('❌ مدة غير صالحة! (10m, 1h, 7d). الحد الأقصى 28 يوم.');
        }

        try {
            await member.timeout(durationMs, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('⏳ تم تطبيق الإسكات المؤقت (Timeout)')
                .addFields(
                    { name: '👤 العضو', value: `${targetUser}`, inline: true },
                    { name: '⏱️ المدة', value: durationStr, inline: true },
                    { name: '🛡️ بواسطة', value: message.author.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Timeout error:', error);
            message.reply('❌ حدث خطأ أثناء تنفيذ الأمر.');
        }
    }
};
