const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('إسكات عضو (28 يوم) | Mute a user (28 days)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('العضو | The user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('السبب | Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', flags: [MessageFlags.Ephemeral] });
    }

    if (!member.moderatable) {
      return interaction.reply({ content: '❌ لا يمكنني إسكات هذا العضو.', flags: [MessageFlags.Ephemeral] });
    }

    try {
      // Hardcoded 28 days for "mute" command
      await member.timeout(28 * 24 * 60 * 60 * 1000, reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔇 تم الإسكات (Mute)')
        .addFields(
          { name: '👤 العضو', value: `${target.tag} (${target.id})`, inline: true },
          { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تنفيذ الإسكات.', flags: [MessageFlags.Ephemeral] });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member || !member.moderatable) return message.reply('❌ لا يمكنني إسكات هذا العضو.');

    const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

    try {
      await member.timeout(28 * 24 * 60 * 60 * 1000, reason);
      message.reply(`✅ تم إسكات ${target.tag} بنجاح.`);
    } catch (error) {
      console.error(error);
      message.reply('❌ حدث خطأ.');
    }
  }
};
