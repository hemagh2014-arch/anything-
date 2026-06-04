const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('إزالة الإسكات عن عضو | Unmute a user')
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

    if (!member.communicationDisabledUntilTimestamp) {
      return interaction.reply({ content: '❌ هذا العضو ليس لديه إسكات مؤقت حالياً.', flags: [MessageFlags.Ephemeral] });
    }

    try {
      await member.timeout(null, reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔊 تم إلغاء الإسكات (Unmute)')
        .addFields(
          { name: '👤 العضو', value: `${target.tag}`, inline: true },
          { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ حدث خطأ أثناء محاولة إلغاء الإسكات.', flags: [MessageFlags.Ephemeral] });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member || !member.communicationDisabledUntilTimestamp) return message.reply('❌ العضو غير مسكت.');

    const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

    try {
      await member.timeout(null, reason);
      message.reply(`✅ تم إلغاء إسكات ${target.tag}.`);
    } catch (error) {
      console.error(error);
      message.reply('❌ حدث خطأ.');
    }
  }
};
