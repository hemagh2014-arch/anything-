const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getWarnings } = require('../../utils/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('عرض تحذيرات عضو | View a user\'s warnings')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const warns = getWarnings(interaction.guildId, target.id);

        if (warns.length === 0) {
            return interaction.reply({ content: `✅ **${target.tag}** ليس لديه أي تحذيرات.`, flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle(`📋 تحذيرات ${target.tag}`)
            .setDescription(`إجمالي التحذيرات: **${warns.length}**`)
            .setTimestamp();

        warns.forEach((warn, index) => {
            embed.addFields({
                name: `تحذير #${index + 1}`,
                value: `**السبب:** ${warn.reason}\n**بواسطة:** <@${warn.moderatorId}>\n**التاريخ:** <t:${Math.floor(new Date(warn.timestamp).getTime() / 1000)}:R>`
            });
        });

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null) || message.author;
        const warns = getWarnings(message.guildId, target.id);

        if (warns.length === 0) {
            return message.reply(`✅ **${target.tag}** ليس لديه أي تحذيرات.`);
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle(`📋 تحذيرات ${target.tag}`)
            .setDescription(`إجمالي التحذيرات: **${warns.length}**`)
            .setTimestamp();

        warns.forEach((warn, index) => {
            embed.addFields({
                name: `تحذير #${index + 1}`,
                value: `**السبب:** ${warn.reason}\n**بواسطة:** <@${warn.moderatorId}>\n**التاريخ:** <t:${Math.floor(new Date(warn.timestamp).getTime() / 1000)}:R>`
            });
        });

        await message.reply({ embeds: [embed] });
    }
};
