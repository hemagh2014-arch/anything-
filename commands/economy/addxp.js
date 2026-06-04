const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addXP, getUserXP } = require('../../utils/xp');
const { isDeveloper } = require('../../utils/security');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('إضافة XP لمستخدم (للمطورين) | Add XP to a user (Devs only)')
    .addUserOption(opt => opt.setName('user').setDescription('المستخدم | The user').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('الكمية | The amount').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({ content: '❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const xpAmount = interaction.options.getInteger('amount');

    if (xpAmount <= 0) {
      return interaction.reply({ content: '❌ يجب أن يكون عدد الـ XP رقماً صحيحاً موجباً!', ephemeral: true });
    }

    try {
      const result = await addXP(targetUser.id, interaction.guild.id, xpAmount, interaction.client, true);
      const userData = getUserXP(targetUser.id, interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم إضافة XP بنجاح')
        .setDescription(`تم إضافة **${xpAmount}** XP للمستخدم ${targetUser}`)
        .addFields(
          { name: 'المستخدم', value: targetUser.tag, inline: true },
          { name: 'الـ XP المضاف', value: `${xpAmount}`, inline: true },
          { name: 'المستوى الحالي', value: `${userData.level}`, inline: true },
          { name: 'إجمالي الـ XP', value: `${userData.xp}`, inline: true },
          { name: 'بواسطة', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      if (result.leveledUp) {
        embed.addFields({
          name: '🎊 ترقية!',
          value: `المستخدم ترقى من المستوى ${result.oldLevel} إلى المستوى ${result.newLevel}!`
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Add XP command error:', error);
      interaction.reply({ content: '❌ حدث خطأ في إضافة الـ XP!', ephemeral: true });
    }
  },

  async executeMessage(message, args) {
    if (!isDeveloper(message.author.id)) {
      return message.reply('❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!');
    }

    if (args.length < 2) {
      return message.reply('❌ الاستخدام الصحيح: +addxp @منشن عدد_الـxp أو +addxp ايدي_الشخص عدد_الـxp');
    }

    let targetUser;
    let xpAmount;

    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
      xpAmount = parseInt(args[1]);
    } else {
      const userId = args[0];
      targetUser = await message.client.users.fetch(userId).catch(() => null);
      xpAmount = parseInt(args[1]);
    }

    if (!targetUser) {
      return message.reply('❌ لم أستطع العثور على المستخدم!');
    }

    if (isNaN(xpAmount) || xpAmount <= 0) {
      return message.reply('❌ يجب أن يكون عدد الـ XP رقماً صحيحاً موجباً!');
    }

    try {
      const result = await addXP(targetUser.id, message.guild.id, xpAmount, message.client, true);
      const userData = getUserXP(targetUser.id, message.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم إضافة XP بنجاح')
        .setDescription(`تم إضافة **${xpAmount}** XP للمستخدم ${targetUser}`)
        .addFields(
          { name: 'المستخدم', value: targetUser.tag, inline: true },
          { name: 'الـ XP المضاف', value: `${xpAmount}`, inline: true },
          { name: 'المستوى الحالي', value: `${userData.level}`, inline: true },
          { name: 'إجمالي الـ XP', value: `${userData.xp}`, inline: true },
          { name: 'بواسطة', value: message.author.tag, inline: true }
        )
        .setTimestamp();

      if (result.leveledUp) {
        embed.addFields({
          name: '🎊 ترقية!',
          value: `المستخدم ترقى من المستوى ${result.oldLevel} إلى المستوى ${result.newLevel}!`
        });
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Add XP command error:', error);
      message.reply('❌ حدث خطأ في إضافة الـ XP!');
    }
  }
};
