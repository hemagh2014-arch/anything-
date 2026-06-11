const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const avatarSettingsFile = path.join(__dirname, '..', '..', 'data', 'guild_avatars.json');

function loadAvatarSettings() {
  try {
    if (fs.existsSync(avatarSettingsFile)) {
      return JSON.parse(fs.readFileSync(avatarSettingsFile, 'utf8'));
    }
    return {};
  } catch (e) {
    return {};
  }
}

function saveAvatarSettings(data) {
  try {
    fs.writeFileSync(avatarSettingsFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('❌ خطأ في حفظ إعدادات الأفتار:', e);
  }
}

function getGuildAvatar(guildId, client) {
  const settings = loadAvatarSettings();
  if (settings[guildId]) return settings[guildId];
  return client.user.displayAvatarURL({ size: 256 });
}

module.exports = {
  getGuildAvatar,

  data: new SlashCommandBuilder()
    .setName('setbotavatar')
    .setDescription('تغيير صورة البوت المعروضة في هذا السيرفر | Set a custom bot avatar for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('تعيين صورة مخصصة للبوت في هذا السيرفر')
        .addStringOption(opt =>
          opt.setName('url')
            .setDescription('رابط الصورة (PNG/JPG/GIF)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('إعادة الصورة الأصلية للبوت في هذا السيرفر')
    )
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('عرض الصورة الحالية للبوت في هذا السيرفر')
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ تحتاج صلاحية **المسؤول (Administrator)** لاستخدام هذا الأمر!', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const settings = loadAvatarSettings();
    const guildId = interaction.guild.id;

    if (subcommand === 'set') {
      const url = interaction.options.getString('url');

      const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const urlLower = url.toLowerCase().split('?')[0];
      const isValidUrl = url.startsWith('http') && validExtensions.some(ext => urlLower.endsWith(ext));

      if (!isValidUrl) {
        return interaction.reply({
          content: '❌ الرابط غير صالح! تأكد أن الرابط يبدأ بـ `http` وينتهي بـ `.png` أو `.jpg` أو `.gif`',
          ephemeral: true
        });
      }

      settings[guildId] = url;
      saveAvatarSettings(settings);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('✅ تم تعيين الصورة المخصصة')
        .setDescription(`تم حفظ صورة مخصصة للبوت في سيرفر **${interaction.guild.name}**\nستظهر هذه الصورة في الردود والـ embeds داخل هذا السيرفر.`)
        .setThumbnail(url)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'reset') {
      delete settings[guildId];
      saveAvatarSettings(settings);

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔄 تم إعادة الصورة الأصلية')
        .setDescription(`تم حذف الصورة المخصصة لسيرفر **${interaction.guild.name}**\nسيتم استخدام الصورة الأصلية للبوت.`)
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'show') {
      const currentAvatar = settings[guildId] || interaction.client.user.displayAvatarURL({ size: 256 });
      const isCustom = !!settings[guildId];

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🖼️ صورة البوت في هذا السيرفر')
        .setDescription(isCustom
          ? `هذا السيرفر يستخدم **صورة مخصصة** للبوت.`
          : `هذا السيرفر يستخدم **الصورة الأصلية** للبوت.`)
        .setThumbnail(currentAvatar)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ تحتاج صلاحية **المسؤول (Administrator)** لاستخدام هذا الأمر!');
    }

    const settings = loadAvatarSettings();
    const guildId = message.guild.id;

    if (!args[0]) {
      return message.reply('❌ اكتب رابط الصورة بعد الأمر، أو اكتب `reset` لإعادة الصورة الأصلية.');
    }

    if (args[0].toLowerCase() === 'reset') {
      delete settings[guildId];
      saveAvatarSettings(settings);
      return message.reply('🔄 تم إعادة الصورة الأصلية للبوت في هذا السيرفر.');
    }

    const url = args[0];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const urlLower = url.toLowerCase().split('?')[0];
    const isValidUrl = url.startsWith('http') && validExtensions.some(ext => urlLower.endsWith(ext));

    if (!isValidUrl) {
      return message.reply('❌ الرابط غير صالح! تأكد أن الرابط يبدأ بـ `http` وينتهي بـ `.png` أو `.jpg` أو `.gif`');
    }

    settings[guildId] = url;
    saveAvatarSettings(settings);

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle('✅ تم تعيين الصورة المخصصة')
      .setDescription(`تم حفظ صورة مخصصة للبوت في سيرفر **${message.guild.name}**`)
      .setThumbnail(url)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
