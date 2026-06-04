const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('عرض صورة العضو | Show user avatar')
    .addUserOption(opt => opt.setName('target').setDescription('المستخدم | The user').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🖼️ Avatar: ${user.username}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async executeMessage(message, args) {
    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null) || message.author;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🖼️ Avatar: ${user.username}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
