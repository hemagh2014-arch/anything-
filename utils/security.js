const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

const dataFile = path.join(__dirname, '..', 'data', 'security_data.json');
const securityData = { guilds: {} };

const DEVELOPER_IDS = config.developerIds || [];

const DANGEROUS_PERMISSIONS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.MentionEveryone
];

function isDeveloper(userId) {
  return DEVELOPER_IDS.includes(userId);
}

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const rawData = fs.readFileSync(dataFile, 'utf8');
      const data = JSON.parse(rawData);
      securityData.guilds = data.guilds || {};
      console.log('✅ تم تحميل بيانات الحماية بنجاح');
    } else {
      console.log('📝 لم يتم العثور على ملف بيانات الحماية - سيتم إنشاء ملف جديد');
    }
  } catch (e) {
    console.error('❌ خطأ في تحميل بيانات الحماية:', e);
    securityData.guilds = {};
  }

  if (!securityData.guilds) {
    securityData.guilds = {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(securityData, null, 2));
    console.log('💾 تم حفظ بيانات الحماية بنجاح');
  } catch (e) {
    console.error('❌ خطأ في حفظ بيانات الحماية:', e);
  }
}

function initGuildData(guildId) {
  if (!securityData.guilds[guildId]) {
    securityData.guilds[guildId] = {};
  }

  const guildData = securityData.guilds[guildId];

  if (!guildData.protection) {
    guildData.protection = {
      enabled: false,
      antiBot: false,
      antiSpam: false,
      antiRaid: false,
      antiRoleGrant: false,
      roleProtection: false,
      channelProtection: false
    };
  }
  if (!guildData.advancedWhitelist) {
    guildData.advancedWhitelist = { users: {}, roles: {} };
  }
  if (!guildData.backups) {
    guildData.backups = { roles: [], channels: [] };
  }
  if (!guildData.limits) {
    guildData.limits = {
      channelDelete: { limit: 5, action: 'none' },
      roleDelete: { limit: 5, action: 'none' }
    };
  }
  if (!guildData.violations) {
    guildData.violations = {};
  }

  saveData();
  return guildData;
}

function hasPermission(member, guildId, permission) {
  if (!member) return false;
  if (isDeveloper(member.id) || member.id === member.guild.ownerId) return true;
  const guildWl = securityData.guilds[guildId]?.advancedWhitelist;
  if (!guildWl) return false;
  const userPerms = guildWl.users[member.id] || [];
  if (userPerms.includes('BYPASS_ALL') || userPerms.includes(permission)) return true;
  for (const roleId of member.roles.cache.keys()) {
    const rolePerms = guildWl.roles[roleId] || [];
    if (rolePerms.includes('BYPASS_ALL') || rolePerms.includes(permission)) return true;
  }
  return false;
}

async function notifyOwner(guild, embed) {
  try {
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [embed] });
  } catch (e) {
    console.error('Failed to notify owner:', e);
  }
}

async function logToChannel(guild, embed) {
  try {
    const logChannelId = config.security?.logChannelId;
    if (!logChannelId) return;

    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) {
      console.error('Log channel not found:', logChannelId);
      return;
    }

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Failed to log to channel:', e);
  }
}

async function notifyAndLog(guild, embed) {
  await notifyOwner(guild, embed);
  await logToChannel(guild, embed);
}

async function createBackups(guild) {
  const guildData = initGuildData(guild.id);

  guildData.backups.roles = guild.roles.cache.map(role => ({
    id: role.id,
    name: role.name,
    color: role.color,
    permissions: role.permissions.bitfield.toString(),
    position: role.position,
    hoist: role.hoist,
    mentionable: role.mentionable
  }));

  guildData.backups.channels = guild.channels.cache.map(channel => ({
    id: channel.id,
    name: channel.name,
    type: channel.type,
    position: channel.position,
    parentId: channel.parentId,
    permissions: channel.permissionOverwrites?.cache
      ? channel.permissionOverwrites.cache.map(p => ({
        id: p.id,
        type: p.type,
        allow: p.allow.bitfield.toString(),
        deny: p.deny.bitfield.toString()
      }))
      : []
  }));

  saveData();
}

async function restoreRoles(guild, guildData) {
  guildData = guildData || securityData.guilds[guild.id] || initGuildData(guild.id);
  const backupRoles = guildData?.backups?.roles;

  if (!backupRoles || backupRoles.length === 0) {
    console.log('No role backups found for this server.');
    return 0;
  }

  let restoredCount = 0;

  for (const roleData of [...backupRoles].reverse()) {
    if (!guild.roles.cache.has(roleData.id)) {
      try {
        await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          permissions: BigInt(roleData.permissions),
          hoist: roleData.hoist,
          mentionable: roleData.mentionable,
          reason: 'استعادة من النسخة الاحتياطية'
        });
        restoredCount++;
      } catch (e) {
        console.error(`Failed to restore role ${roleData.name}:`, e.message);
      }
    }
  }

  return restoredCount;
}

async function restoreChannels(guild, guildData) {
  guildData = guildData || securityData.guilds[guild.id] || initGuildData(guild.id);
  const backupChannels = guildData?.backups?.channels;

  if (!backupChannels || backupChannels.length === 0) {
    console.log('No channel backups found for this server.');
    return 0;
  }

  let restoredCount = 0;
  const categories = backupChannels.filter(c => c.type === 4);
  const others = backupChannels.filter(c => c.type !== 4);

  for (const channelData of [...categories, ...others]) {
    if (!guild.channels.cache.has(channelData.id)) {
      try {
        const perms = (channelData.permissions || []).map(p => ({
          id: p.id,
          allow: BigInt(p.allow),
          deny: BigInt(p.deny)
        }));

        const created = await guild.channels.create({
          name: channelData.name,
          type: channelData.type,
          position: channelData.position,
          parent: channelData.parentId,
          permissionOverwrites: perms,
          reason: 'استعادة من النسخة الاحتياطية'
        });

        if (typeof channelData.position === 'number') {
          await created.setPosition(channelData.position).catch(() => null);
        }

        restoredCount++;
      } catch (e) {
        console.error(`Failed to restore channel ${channelData.name}:`, e.message);
      }
    }
  }

  return restoredCount;
}

async function restoreDeletedChannel(guild, deletedChannelId) {
  try {
    const guildData = securityData.guilds[guild.id];
    const backups = guildData?.backups?.channels || [];
    const backup = backups.find(c => c.id === deletedChannelId);

    if (!backup) {
      return { restored: false, reason: 'no_backup' };
    }

    let parentId = backup.parentId || null;
    let parentRestored = false;

    if (parentId && !guild.channels.cache.has(parentId)) {
      const parentBackup = backups.find(c => c.id === parentId && c.type === 4);
      if (parentBackup) {
        try {
          const parentPerms = (parentBackup.permissions || []).map(p => ({
            id: p.id,
            allow: BigInt(p.allow),
            deny: BigInt(p.deny)
          }));
          const newParent = await guild.channels.create({
            name: parentBackup.name,
            type: parentBackup.type,
            permissionOverwrites: parentPerms,
            reason: 'استعادة تلقائية للفئة بعد حذف غير مصرح به'
          });
          parentId = newParent.id;
          parentRestored = true;
        } catch (e) {
          console.error('Failed to restore parent category:', e);
          parentId = null;
        }
      } else {
        parentId = null;
      }
    }

    const perms = (backup.permissions || []).map(p => ({
      id: p.id,
      allow: BigInt(p.allow),
      deny: BigInt(p.deny)
    }));

    const newChannel = await guild.channels.create({
      name: backup.name,
      type: backup.type,
      parent: parentId ?? undefined,
      permissionOverwrites: perms,
      reason: 'استعادة تلقائية بعد حذف غير مصرح به'
    });

    if (typeof backup.position === 'number') {
      await newChannel.setPosition(backup.position).catch(() => null);
    }

    return { restored: true, channel: newChannel, parentRestored };
  } catch (e) {
    console.error('Failed to restore deleted channel:', e);
    return { restored: false, reason: 'create_failed', error: e };
  }
}

module.exports = {
  securityData,
  DEVELOPER_IDS,
  DANGEROUS_PERMISSIONS,
  isDeveloper,
  loadData,
  saveData,
  initGuildData,
  hasPermission,
  notifyOwner,
  logToChannel,
  notifyAndLog,
  createBackups,
  restoreRoles,
  restoreChannels,
  restoreDeletedChannel
};
