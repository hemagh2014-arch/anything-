const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر | Ban a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('العضو | The user')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('السبب | Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        try {
            if (member) {
                if (!member.bannable) {
                    return interaction.reply({ content: '❌ لا يمكنني حظر هذا العضو (رتبته أعلى مني أو رتبتي غير كافية).', flags: [MessageFlags.Ephemeral] });
                }
                await member.ban({ reason });
            } else {
                await interaction.guild.members.ban(target.id, { reason });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔨 تم تنفيذ الحظر (Ban)')
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو المحظور', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تنفيذ الحظر.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن عضو أو كتابة الأيدي لحظره.');

        const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';
        const member = await message.guild.members.fetch(target.id).catch(() => null);

        try {
            if (member) {
                if (!member.bannable) return message.reply('❌ لا يمكنني حظر هذا العضو.');
                await member.ban({ reason });
            } else {
                await message.guild.members.ban(target.id, { reason });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔨 تم تنفيذ الحظر')
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 المحظور', value: `${target.tag}`, inline: true },
                    { name: '🛡️ بواسطة', value: message.author.tag, inline: true },
                    { name: '📝 السبب', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
