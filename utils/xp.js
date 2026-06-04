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
    console.log('💾 تم حفظ بيانات XP بنجاح');
  } catch (e) {
    console.error('❌ خطأ في حفظ بيانات XP:', e);
  }
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
    if (totalMessages + messagesNeeded > xp) {
      break;
    }
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
  
  return {
    current: messagesInCurrentLevel,
    needed: needed,
    percentage: Math.min(percentage, 100)
  };
}

function getUserXP(userId, guildId) {
  if (!xpData[guildId]) {
    xpData[guildId] = {};
  }
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 1,
      totalMessages: 0
    };
  }
  return xpData[guildId][userId];
}

async function addXP(userId, guildId, amount, client, isManual = false) {
  const userData = getUserXP(userId, guildId);
  const oldLevel = userData.level;
  userData.xp += amount;
  userData.totalMessages += amount;
  userData.level = getLevelFromXP(userData.xp);
  
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
      .setDescription(`${randomMessage}`)
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

function getTopUsers(guildId, limit = 10) {
  if (!xpData[guildId]) {
    return [];
  }

  const users = Object.entries(xpData[guildId])
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);

  return users;
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
