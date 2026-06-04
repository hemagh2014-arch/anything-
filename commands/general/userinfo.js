const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('عرض معلومات المستخدم | Show user information')
    .addUserOption(opt => opt.setName('target').setDescription('المستخدم | The user').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`👤 User Info: ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Tag', value: `\`${user.tag}\``, inline: true },
        { name: 'ID', value: `\`${user.id}\``, inline: true },
        { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: member.roles.cache.map(r => r).join(' ') || 'None' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async executeMessage(message, args) {
    const user = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null) || message.author;
    const member = await message.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`👤 User Info: ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Tag', value: `\`${user.tag}\``, inline: true },
        { name: 'ID', value: `\`${user.id}\``, inline: true },
        { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: member.roles.cache.map(r => r).join(' ') || 'None' }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
