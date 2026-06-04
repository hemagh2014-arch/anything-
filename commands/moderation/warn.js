const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { addWarning } = require('../../utils/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('تحذير عضو | Warn a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب | Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        if (target.bot) return interaction.reply({ content: '❌ لا يمكنك تحذير البوتات.', flags: [MessageFlags.Ephemeral] });

        const warnCount = addWarning(interaction.guildId, target.id, interaction.user.id, reason);

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('⚠️ تم إضافة تحذير جديد')
            .addFields(
                { name: '👤 العضو', value: `${target} (${target.id})`, inline: true },
                { name: '🔢 عدد التحذيرات', value: `${warnCount}`, inline: true },
                { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
                { name: '📝 السبب', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Try to notify the user
        try {
            await target.send(`⚠️ لقد تلقيت تحذيراً في سيرفر **${interaction.guild.name}**\n**السبب:** ${reason}\n**إجمالي التحذيرات:** ${warnCount}`);
        } catch (e) {
            // Ignore if DMs are closed
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن عضو أو كتابة الأيدي.');

        const reason = args.slice(1).join(' ');
        if (!reason) return message.reply('❌ يرجى كتابة سبب التحذير.');

        if (target.bot) return message.reply('❌ لا يمكنك تحذير البوتات.');

        const warnCount = addWarning(message.guildId, target.id, message.author.id, reason);

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('⚠️ تم إضافة تحذير جديد')
            .addFields(
                { name: '👤 العضو', value: `${target}`, inline: true },
                { name: '🔢 عدد التحذيرات', value: `${warnCount}`, inline: true },
                { name: '🛡️ بواسطة', value: message.author.tag, inline: true },
                { name: '📝 السبب', value: reason }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });

        try {
            await target.send(`⚠️ لقد تلقيت تحذيراً في سيرفر **${message.guild.name}**\n**السبب:** ${reason}\n**إجمالي التحذيرات:** ${warnCount}`);
        } catch (e) { }
    }
};
