const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { securityData, isDeveloper, initGuildData, saveData } = require('../../utils/security');

const protectionChoices = [
  { name: 'Bypass All Protections', value: 'BYPASS_ALL' },
  { name: 'Bypass Anti-Bot', value: 'BYPASS_ANTI_BOT' },
  { name: 'Bypass Anti-Spam', value: 'BYPASS_ANTI_SPAM' },
  { name: 'Bypass Anti-Role Grant', value: 'BYPASS_ANTI_ROLE_GRANT' },
  { name: 'Bypass Role Protection', value: 'BYPASS_ROLE_PROTECTION' },
  { name: 'Bypass Channel Protection', value: 'BYPASS_CHANNEL_PROTECTION' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('إدارة صلاحيات الوايت ليست المتقدمة')
    .setDefaultMemberPermissions(0)
    .addSubcommandGroup(group =>
      group.setName('grant').setDescription('منح صلاحية')
        .addSubcommand(sub =>
          sub.setName('user').setDescription('منح صلاحية لمستخدم')
            .addUserOption(o => o.setName('user').setDescription('المستخدم').setRequired(true))
            .addStringOption(o => o.setName('permission').setDescription('الصلاحية').setRequired(true).addChoices(...protectionChoices))
        )
        .addSubcommand(sub =>
          sub.setName('role').setDescription('منح صلاحية لرتبة')
            .addRoleOption(o => o.setName('role').setDescription('الرتبة').setRequired(true))
            .addStringOption(o => o.setName('permission').setDescription('الصلاحية').setRequired(true).addChoices(...protectionChoices))
        )
    )
    .addSubcommandGroup(group =>
      group.setName('revoke').setDescription('سحب صلاحية')
        .addSubcommand(sub =>
          sub.setName('user').setDescription('سحب صلاحية من مستخدم')
            .addUserOption(o => o.setName('user').setDescription('المستخدم').setRequired(true))
            .addStringOption(o => o.setName('permission').setDescription('الصلاحية').setRequired(true).addChoices(...protectionChoices))
        )
        .addSubcommand(sub =>
          sub.setName('role').setDescription('سحب صلاحية من رتبة')
            .addRoleOption(o => o.setName('role').setDescription('الرتبة').setRequired(true))
            .addStringOption(o => o.setName('permission').setDescription('الصلاحية').setRequired(true).addChoices(...protectionChoices))
        )
    )
    .addSubcommand(sub => sub.setName('view').setDescription('عرض صلاحيات الوايت ليست الحالية')),

  async execute(interaction) {
    if (!isDeveloper(interaction.user.id)) {
      return interaction.reply({ content: '❌ هذه الأوامر للمطورين فقط.', flags: MessageFlags.Ephemeral });
    }

    const guildId = interaction.guild.id;
    const guildData = initGuildData(guildId); // ✅ يضمن وجود advancedWhitelist دائماً

    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const targetRole = interaction.options.getRole('role');
    const permission = interaction.options.getString('permission');

    if (subcommand === 'view') {
      const wl = guildData.advancedWhitelist;
      const embed = new EmbedBuilder()
        .setTitle('📋 Whitelist Members')
        .setColor(0xFFFFFF);

      let userPerms = Object.entries(wl.users).map(([id, perms]) => `<@${id}>: \`${perms.join(', ')}\``).join('\n') || 'لا يوجد';
      embed.addFields({ name: '👥 صلاحيات المستخدمين', value: userPerms });

      let rolePerms = Object.entries(wl.roles).map(([id, perms]) => `<@&${id}>: \`${perms.join(', ')}\``).join('\n') || 'لا يوجد';
      embed.addFields({ name: '🏷️ صلاحيات الرولات', value: rolePerms });

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const targetId = targetUser ? targetUser.id : targetRole.id;
    const targetType = targetUser ? 'users' : 'roles';
    const wl = guildData.advancedWhitelist;

    if (group === 'grant') {
      if (!wl[targetType][targetId]) wl[targetType][targetId] = [];
      if (wl[targetType][targetId].includes(permission)) {
        return interaction.reply({ content: '❌ هذه الصلاحية ممنوحة بالفعل.', flags: MessageFlags.Ephemeral });
      }
      wl[targetType][targetId].push(permission);
      saveData();
      interaction.reply({ content: `✅ تم منح صلاحية \`${permission}\` بنجاح.`, flags: MessageFlags.Ephemeral });

    } else if (group === 'revoke') {
      if (!wl[targetType][targetId] || !wl[targetType][targetId].includes(permission)) {
        return interaction.reply({ content: '❌ هذه الصلاحية غير ممنوحة أصلاً.', flags: MessageFlags.Ephemeral });
      }
      wl[targetType][targetId] = wl[targetType][targetId].filter(p => p !== permission);
      if (wl[targetType][targetId].length === 0) delete wl[targetType][targetId];
      saveData();
      interaction.reply({ content: `🗑️ تم سحب صلاحية \`${permission}\` بنجاح.`, flags: MessageFlags.Ephemeral });
    }
  }
};
