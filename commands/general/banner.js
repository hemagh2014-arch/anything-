const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('عرض بنر العضو | Show user banner')
        .addUserOption(opt => opt.setName('target').setDescription('المستخدم | The user').setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const fetchUser = await interaction.client.users.fetch(user.id, { force: true });

        const banner = fetchUser.bannerURL({ dynamic: true, size: 1024 });

        if (!banner) {
            return interaction.reply({ content: `❌ **${user.tag}** ليس لديه بنر.`, flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🖼️ Banner: ${user.username}`)
            .setImage(banner)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async executeMessage(message, args) {
        const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null) || message.author;
        const fetchUser = await message.client.users.fetch(user.id, { force: true });

        const banner = fetchUser.bannerURL({ dynamic: true, size: 1024 });

        if (!banner) return message.reply('❌ هذا العضو ليس لديه بنر.');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🖼️ Banner: ${user.username}`)
            .setImage(banner)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
