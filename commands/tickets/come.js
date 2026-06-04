const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('come')
        .setDescription('استدعاء عضو إلى التذكرة | Summon a user to the ticket')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المراد استدعاؤه | User to summon').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if we are in a ticket channel
        // Tickets usually have 'ticket-' in their name or we can check the category later if we had settings
        if (!interaction.channel.name.includes('ticket-')) {
            return interaction.reply({ content: '❌ هذا الأمر مخصص للاستخدام داخل التذاكر فقط.', flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('target');

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('📢 استدعاء | Summon')
            .setDescription(`يا ${targetUser}، تم طلب حضورك في هذه التذكرة بواسطة ${interaction.user}.\n\nHello ${targetUser}, you have been requested to join this ticket by ${interaction.user}.`)
            .setTimestamp();

        await interaction.reply({ content: `${targetUser}`, embeds: [embed] });
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

        if (!message.channel.name.includes('ticket-')) {
            return message.reply('❌ هذا الأمر مخصص للتذاكر فقط.');
        }

        const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
        if (!targetUser) return message.reply('❌ يرجى منشن العضو.');

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('📢 استدعاء | Summon')
            .setDescription(`يا ${targetUser}، تم طلب حضورك في هذه التذكرة بواسطة ${message.author}.\n\nHello ${targetUser}, you have been requested to join this ticket by ${message.author}.`)
            .setTimestamp();

        message.reply({ content: `${targetUser}`, embeds: [embed] });
    }
};
