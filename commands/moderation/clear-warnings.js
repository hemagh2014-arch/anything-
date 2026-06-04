const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { clearWarnings } = require('../../utils/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-warnings')
        .setDescription('مسح جميع تحذيرات عضو | Clear all warnings of a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const count = clearWarnings(interaction.guildId, target.id);

        if (count === 0) {
            return interaction.reply({ content: `❌ **${target.tag}** ليس لديه أي تحذيرات لمسحها.`, flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('🗑️ تم مسح التحذيرات')
            .setDescription(`تم مسح جميع التحذيرات الخاصة بـ **${target}** بنجاح.`)
            .addFields(
                { name: '🔢 عدد التحذيرات الممسوحة', value: `${count}`, inline: true },
                { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن عضو أو كتابة الأيدي.');

        const count = clearWarnings(message.guildId, target.id);

        if (count === 0) {
            return message.reply(`❌ **${target.tag}** ليس لديه أي تحذيرات لمسحها.`);
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('🗑️ تم مسح التحذيرات')
            .setDescription(`تم مسح جميع التحذيرات الخاصة بـ **${target}** بنجاح.`)
            .addFields(
                { name: '🔢 عدد التحذيرات الممسوحة', value: `${count}`, inline: true },
                { name: '🛡️ بواسطة', value: message.author.tag, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
