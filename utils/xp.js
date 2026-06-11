const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const xpDataFile = path.join(__dirname, '..', config.xp.xpDataFile);
let xpData = {};

function loadXPData() {
  try {
    if (fs.existsSync(xpDataFile)) {
      const rawData = fs.readFileSync(xpDataFile, 'utf8');
      xpData = JSON.parse(rawData);
      console.log('✅ تم تحميل بيانات XP بنجاح');
    } else {
      console.log('📝 لم يتم العثور على ملف بيانات XP - سيتم إنشاء ملف جديد');
      xpData = {};
    }
  } catch (e) {
    console.error('❌ خطأ في تحميل بيانات XP:', e);
    xpData = {};
  }
}

function saveXPData() {
  try {
    fs.writeFileSync(xpDataFile, JSON.stringify(xpData, null, 2));
  } catch (e) {
    console.error('❌ خطأ في حفظ بيانات XP:', e);
  }
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getDateRange(period) {
  const now = new Date();
  if (period === 'daily') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (period === 'monthly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  return null; // alltime
}

function getMessagesForLevel(level) {
  if (level <= 1) return 0;
  return config.xp.baseMessages * Math.pow(2, level - 2);
}

function getLevelFromXP(xp) {
  let level = 1;
  let totalMessages = 0;
  while (level < config.xp.maxLevel) {
    const messagesNeeded = getMessagesForLevel(level + 1);
    if (totalMessages + messagesNeeded > xp) break;
    totalMessages += messagesNeeded;
    level++;
  }
  return level;
}

function getProgressToNextLevel(xp) {
  const currentLevel = getLevelFromXP(xp);
  if (currentLevel >= config.xp.maxLevel) {
    return { current: 0, needed: 0, percentage: 100 };
  }
  const messagesForCurrentLevel = getMessagesForLevel(currentLevel);
  const messagesForNextLevel = getMessagesForLevel(currentLevel + 1);
  const messagesInCurrentLevel = xp - messagesForCurrentLevel;
  const needed = messagesForNextLevel - messagesForCurrentLevel;
  const percentage = (messagesInCurrentLevel / needed) * 100;
  return { current: messagesInCurrentLevel, needed, percentage: Math.min(percentage, 100) };
}

function getUserXP(userId, guildId) {
  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = { xp: 0, level: 1, totalMessages: 0, daily: {} };
  }
  if (!xpData[guildId][userId].daily) {
    xpData[guildId][userId].daily = {};
  }
  return xpData[guildId][userId];
}

async function addXP(userId, guildId, amount, client, isManual = false) {
  const userData = getUserXP(userId, guildId);
  const oldLevel = userData.level;
  userData.xp += amount;
  userData.totalMessages += amount;
  userData.level = getLevelFromXP(userData.xp);

  // Track daily messages with timestamp
  const todayKey = getTodayKey();
  if (!userData.daily[todayKey]) userData.daily[todayKey] = 0;
  userData.daily[todayKey] += amount;

  // Keep only last 35 days to avoid file bloat
  const keys = Object.keys(userData.daily).sort();
  if (keys.length > 35) {
    keys.slice(0, keys.length - 35).forEach(k => delete userData.daily[k]);
  }

  saveXPData();

  if (userData.level > oldLevel) {
    await sendLevelUpMessage(userId, guildId, userData.level, client);
  }

  return { oldLevel, newLevel: userData.level, leveledUp: userData.level > oldLevel };
}

async function sendLevelUpMessage(userId, guildId, level, client) {
  try {
    const channelId = config.xp.levelUpChannelId;
    if (!channelId) return;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const messages = [
      `🎉 مبروك ${member} وصلت للمستوى ${level}!`,
      `🌟 ${member} صار مستوى ${level}! استمر في التفاعل!`,
      `🏆 ${member} قفز للمستوى ${level}! أنت أسطورة!`,
      `✨ ${member} وصل للمستوى ${level}! رائع جداً!`,
      `🚀 ${member} صار مستوى ${level}! واصل التقدم!`
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle('🎊 Level Up!')
      .setDescription(randomMessage)
      .addFields(
        { name: 'المستوى الجديد', value: `**${level}**`, inline: true },
        { name: 'عدد الرسائل', value: `**${getUserXP(userId, guildId).totalMessages}**`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (error) {
    console.error('Level up message error:', error);
  }
}

function getPeriodMessages(userData, period) {
  if (!period || period === 'alltime') return userData.totalMessages;
  if (!userData.daily) return 0;

  const startTs = getDateRange(period);
  const startDate = new Date(startTs).toISOString().slice(0, 10);

  return Object.entries(userData.daily)
    .filter(([dateKey]) => dateKey >= startDate)
    .reduce((sum, [, count]) => sum + count, 0);
}

function getTopUsers(guildId, limit = 10, period = 'alltime') {
  if (!xpData[guildId]) return [];

  return Object.entries(xpData[guildId])
    .map(([userId, data]) => {
      const periodMessages = getPeriodMessages(data, period);
      return {
        userId,
        xp: data.xp,
        level: data.level,
        totalMessages: data.totalMessages,
        periodMessages
      };
    })
    .filter(u => u.periodMessages > 0)
    .sort((a, b) => b.periodMessages - a.periodMessages)
    .slice(0, limit);
}

function resetXP(guildId) {
  xpData[guildId] = {};
  saveXPData();
}

module.exports = {
  loadXPData,
  saveXPData,
  getMessagesForLevel,
  getLevelFromXP,
  getProgressToNextLevel,
  getUserXP,
  addXP,
  sendLevelUpMessage,
  getTopUsers,
  resetXP
};
