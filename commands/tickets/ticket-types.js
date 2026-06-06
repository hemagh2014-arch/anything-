const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', '..', 'data', 'ticketSettings.json');

function loadSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  const dataDir = path.dirname(settingsPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-types')
    .setDescription('إدارة أنواع التيكتات في القائمة المنسدلة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('إضافة نوع تيكت جديد للقائمة')
        .addStringOption(opt =>
          opt.setName('label').setDescription('اسم الخيار الذي يظهر في القائمة').setRequired(true))
        .addStringOption(opt =>
          opt.setName('value').setDescription('معرّف فريد للخيار (بدون مسافات مثل: support)').setRequired(true))
        .addStringOption(opt =>
          opt.setName('emoji').setDescription('إيموجي يظهر أمام الخيار (اختياري)').setRequired(false))
        .addStringOption(opt =>
          opt.setName('description').setDescription('وصف قصير للخيار (اختياري)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('حذف نوع تيكت من القائمة')
        .addStringOption(opt =>
          opt.setName('value').setDescription('معرّف الخيار الذي تريد حذفه').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('عرض جميع أنواع التيكتات الحالية')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = loadSettings();
    const guildSettings = settings[interaction.guildId] || {};
    const types = guildSettings.ticketTypes || [];

    if (sub === 'add') {
      const label = interaction.options.getString('label');
      const value = interaction.options.getString('value').replace(/\s+/g, '_').toLowerCase();
      const emoji = interaction.options.getString('emoji') || null;
      const description = interaction.options.getString('description') || null;

      if (types.length >= 25) {
        return interaction.reply({ content: '❌ لا يمكن إضافة أكثر من 25 خياراً في القائمة!', ephemeral: true });
      }

      if (types.find(t => t.value === value)) {
        return interaction.reply({ content: `❌ يوجد بالفعل خيار بالمعرّف \`${value}\`!`, ephemeral: true });
      }

      const newType = { label, value };
      if (emoji) newType.emoji = emoji;
      if (description) newType.description = description;

      types.push(newType);
      if (!settings[interaction.guildId]) settings[interaction.guildId] = {};
      settings[interaction.guildId].ticketTypes = types;
      saveSettings(settings);

      await interaction.reply({
        content: `✅ تم إضافة الخيار **${emoji ? emoji + ' ' : ''}${label}** للقائمة بنجاح!`,
        ephemeral: true
      });

    } else if (sub === 'remove') {
      const value = interaction.options.getString('value');
      const index = types.findIndex(t => t.value === value);

      if (index === -1) {
        return interaction.reply({ content: `❌ لا يوجد خيار بالمعرّف \`${value}\`!`, ephemeral: true });
      }

      const removed = types.splice(index, 1)[0];
      settings[interaction.guildId].ticketTypes = types;
      saveSettings(settings);

      await interaction.reply({
        content: `✅ تم حذف الخيار **${removed.label}** من القائمة!`,
        ephemeral: true
      });

    } else if (sub === 'list') {
      if (types.length === 0) {
        return interaction.reply({
          content: '📋 لا توجد أنواع تيكتات مضافة بعد.\nاستخدم `/ticket-types add` لإضافة خيارات للقائمة.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 أنواع التيكتات')
        .setDescription(types.map((t, i) =>
          `\`${i + 1}\` ${t.emoji ? t.emoji + ' ' : ''}**${t.label}** — \`${t.value}\`${t.description ? `\n> ${t.description}` : ''}`
        ).join('\n'))
        .setColor(0xFFFFFF)
        .setFooter({ text: `${types.length} / 25 خيار` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async executeMessage(message) {
    return message.reply('❌ هذا الأمر متاح فقط عبر الـ Slash Commands `/ticket-types`');
  }
};
