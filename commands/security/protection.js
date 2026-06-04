const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isDeveloper, initGuildData, saveData } = require('../../utils/security');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('protection')
    .setDescription('إعدادات الحماية')
    .setDefaultMemberPermissions(0)
    .addSubcommand(s =>
      s.setName('toggle').setDescription('تشغيل/إيقاف حماية')
        .addStringOption(o => o.setName('type').setDescription('نوع الحماية').setRequired(true)
          .addChoices(
            { name: 'Anti-Bot', value: 'antiBot' },
            { name: 'Anti-Spam', value: 'antiSpam' },
            { name: 'Anti-Raid', value: 'antiRaid' },
            { name: 'Anti-Role Grant', value: 'antiRoleGrant' },
            { name: 'Role Protection', value: 'roleProtection' },
            { name: 'Channel Protection', value: 'channelProtection' }
          ))
    )
    .addSubcommand(s => s.setName('status').setDescription('عرض حالة الحماية')),

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({ content: '❌ هذه الأوامر للمطورين فقط.', flags: [MessageFlags.Ephemeral] });
    }

    try {
      const guildData = initGuildData(interaction.guild.id);

      if (!guildData || !guildData.protection) {
        return interaction.reply({ content: '❌ حدث خطأ في تحميل بيانات الحماية الخاصة بالسيرفر.', flags: [MessageFlags.Ephemeral] });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'toggle') {
        const type = interaction.options.getString('type');
        guildData.protection[type] = !guildData.protection[type];
        saveData();
        await interaction.reply({
          content: `${guildData.protection[type] ? '✅' : '❌'} تم ${guildData.protection[type] ? 'تفعيل' : 'إلغاء'} حماية ${type}.`,
          flags: [MessageFlags.Ephemeral]
        });
      } else if (subcommand === 'status') {
        const embed = new EmbedBuilder()
          .setTitle('🛡️ حالة الحماية')
          .addFields(
            Object.entries(guildData.protection).map(([key, value]) => ({
              name: key,
              value: value ? '✅ مفعل' : '❌ معطل',
              inline: true
            }))
          )
          .setColor(0xFFFFFF);
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
      }
    } catch (error) {
      console.error('Error in protection command:', error);
      const errorMsg = { content: '❌ حدث خطأ غير متوقع في نظام الحماية.', flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg).catch(() => { });
      } else {
        await interaction.reply(errorMsg).catch(() => { });
      }
    }
  }
};
