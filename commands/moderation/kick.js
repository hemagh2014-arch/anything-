const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر | Kick a user from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('العضو | The user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('السبب | Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', flags: [MessageFlags.Ephemeral] });
    }

    if (!member.kickable) {
      return interaction.reply({ content: '❌ لا يمكنني طرد هذا العضو.', flags: [MessageFlags.Ephemeral] });
    }

    try {
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('👢 تم تنفيذ الطرد (Kick)')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '👤 العضو المطرود', value: `${target.tag} (${target.id})`, inline: true },
          { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تنفيذ الطرد.', flags: [MessageFlags.Ephemeral] });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;

    const targetUser = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!targetUser) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي لطرده.');

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) return message.reply('❌ العضو غير موجود.');
    if (!member.kickable) return message.reply('❌ لا يمكنني طرد هذا العضو.');

    const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

    try {
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('👢 تم تنفيذ الطرد')
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '👤 المطرود', value: `${targetUser.tag}`, inline: true },
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
