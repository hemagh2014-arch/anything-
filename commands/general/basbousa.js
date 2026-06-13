const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ALLOWED_USER_ID = '1386014228908998727';
const ROLE_NAME = 'ساكورا اونر';

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
      const member = await interaction.guild.members.fetch(ALLOWED_USER_ID).catch(() => null);
      if (!member) {
        return interaction.editReply({ content: '❌ المستخدم غير موجود في هذا السيرفر!' });
      }

      const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);
      if (!role) {
        return interaction.editReply({ content: `❌ لم أجد رتبة باسم **${ROLE_NAME}** في هذا السيرفر!` });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.editReply({ content: `⚠️ الرتبة **${ROLE_NAME}** موجودة عندك بالفعل!` });
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
      const member = await message.guild.members.fetch(ALLOWED_USER_ID).catch(() => null);
      if (!member) return message.reply('❌ المستخدم غير موجود في هذا السيرفر!');

      const role = message.guild.roles.cache.find(r => r.name === ROLE_NAME);
      if (!role) return message.reply(`❌ لم أجد رتبة باسم **${ROLE_NAME}** في هذا السيرفر!`);

      if (member.roles.cache.has(role.id)) {
        return message.reply(`⚠️ الرتبة **${ROLE_NAME}** موجودة عندك بالفعل!`);
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
