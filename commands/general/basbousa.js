const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ALLOWED_USER_ID = '1386014228908998727';
const SPECIAL_ROLE_IDS = ['1512122678780231712', '1513933087883526286'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basbousa')
    .setDescription('منح الرتب الخاصة'),

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

      const added = [];
      const alreadyHas = [];

      for (const roleId of SPECIAL_ROLE_IDS) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) continue;
        if (member.roles.cache.has(roleId)) {
          alreadyHas.push(role.name);
        } else {
          await member.roles.add(role, 'منح رتبة خاصة');
          added.push(role.name);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم منح الرتب')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})`, inline: false },
          { name: '✅ تم إضافتها', value: added.length > 0 ? added.map(r => `• ${r}`).join('\n') : 'لا شيء', inline: true },
          { name: '⚠️ كانت موجودة', value: alreadyHas.length > 0 ? alreadyHas.map(r => `• ${r}`).join('\n') : 'لا شيء', inline: true }
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

      const added = [];
      const alreadyHas = [];

      for (const roleId of SPECIAL_ROLE_IDS) {
        const role = message.guild.roles.cache.get(roleId);
        if (!role) continue;
        if (member.roles.cache.has(roleId)) {
          alreadyHas.push(role.name);
        } else {
          await member.roles.add(role, 'منح رتبة خاصة');
          added.push(role.name);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم منح الرتب')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})`, inline: false },
          { name: '✅ تم إضافتها', value: added.length > 0 ? added.map(r => `• ${r}`).join('\n') : 'لا شيء', inline: true },
          { name: '⚠️ كانت موجودة', value: alreadyHas.length > 0 ? alreadyHas.map(r => `• ${r}`).join('\n') : 'لا شيء', inline: true }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('basbousa command error:', e);
      message.reply(`❌ حدث خطأ: ${e.message}`);
    }
  }
};
