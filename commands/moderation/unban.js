const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('إلغاء حظر عضو من السيرفر | Unban a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('الأيدي الخاص بالعضو | The User ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('السبب | Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const targetId = interaction.options.getUser('target').id;
    const reason = interaction.options.getString('reason') || 'لا يوجد سبب | No reason provided';

    try {
      await interaction.guild.members.unban(targetId, reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔓 تم إلغاء الحظر (Unban)')
        .setDescription(`تم إلغاء حظر المستخدم بنجاح.`)
        .addFields(
          { name: '🆔 الأيدي', value: targetId, inline: true },
          { name: '🛡️ بواسطة', value: interaction.user.tag, inline: true },
          { name: '📝 السبب', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ حدث خطأ، تأكد من أن الأيدي صحيح وأن العضو محظور فعلاً.', flags: [MessageFlags.Ephemeral] });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;

    const targetId = args[0];
    if (!targetId) return message.reply('❌ يرجى كتابة الأيدي الخاص بالعضو لإلغاء حظره.');

    const reason = args.slice(1).join(' ') || 'لا يوجد سبب | No reason provided';

    try {
      await message.guild.members.unban(targetId, reason);
      message.reply(`✅ تم إلغاء حظر العضو صاحب الأيدي (${targetId}) بنجاح.`);
    } catch (error) {
      console.error(error);
      message.reply('❌ حدث خطأ، تأكد من الأيدي.');
    }
  }
};
