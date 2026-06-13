const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ALLOWED_USER_ID = '1386014228908998727';
const ROLE_ID = '1513933087883526286';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basbousa')
    .setDescription('منح الرتبة الخاصة'),

  async execute(interaction) {
    if (interaction.user.id !== ALLOWED_USER_ID) {
      return interaction.reply({ content: '❌ هذا الأمر مخصص لشخص معين فقط!', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.guild.roles.fetch();
      const member = await interaction.guild.members.fetch({ user: ALLOWED_USER_ID, force: true });

      if (!member) {
        return interaction.editReply({ content: '❌ المستخدم غير موجود في هذا السيرفر!' });
      }

      const role = interaction.guild.roles.cache.get(ROLE_ID);
      if (!role) {
        return interaction.editReply({ content: `❌ لم أجد الرتبة في هذا السيرفر!` });
      }

      const botMember = await interaction.guild.members.fetchMe();
      if (botMember.roles.highest.position <= role.position) {
        return interaction.editReply({
          content: `❌ رتبة البوت (**${botMember.roles.highest.name}**) أقل من أو تساوي رتبة **${role.name}**.\nاسحب رتبة البوت لأعلى منها في إعدادات السيرفر.`
        });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.editReply({ content: `⚠️ الرتبة **${role.name}** موجودة عندك بالفعل!` });
      }

      await member.roles.add(role, 'منح رتبة خاصة');

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم منح الرتبة')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})` },
          { name: 'الرتبة', value: `${role}` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error('basbousa command error:', e);
      await interaction.editReply({ content: `❌ حدث خطأ: ${e.message}` });
    }
  },

  async executeMessage(message) {
    if (message.author.id !== ALLOWED_USER_ID) {
      return message.reply('❌ هذا الأمر مخصص لشخص معين فقط!');
    }

    try {
      await message.guild.roles.fetch();
      const member = await message.guild.members.fetch({ user: ALLOWED_USER_ID, force: true });
      if (!member) return message.reply('❌ المستخدم غير موجود في هذا السيرفر!');

      const role = message.guild.roles.cache.get(ROLE_ID);
      if (!role) return message.reply(`❌ لم أجد الرتبة في هذا السيرفر!`);

      const botMember = await message.guild.members.fetchMe();
      if (botMember.roles.highest.position <= role.position) {
        return message.reply(`❌ رتبة البوت أقل من رتبة **${role.name}**. اسحب رتبة البوت لأعلى منها.`);
      }

      if (member.roles.cache.has(role.id)) {
        return message.reply(`⚠️ الرتبة **${role.name}** موجودة عندك بالفعل!`);
      }

      await member.roles.add(role, 'منح رتبة خاصة');

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم منح الرتبة')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})` },
          { name: 'الرتبة', value: `${role}` }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('basbousa command error:', e);
      message.reply(`❌ حدث خطأ: ${e.message}`);
    }
  }
};
