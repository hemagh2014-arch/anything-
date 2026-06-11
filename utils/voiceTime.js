const fs = require('fs');
const path = require('path');

const voiceDataFile = path.join(__dirname, '..', 'data', 'voice_time.json');
let voiceData = {};
const activeSessions = {};

function loadVoiceData() {
  try {
    if (fs.existsSync(voiceDataFile)) {
      const raw = fs.readFileSync(voiceDataFile, 'utf8');
      voiceData = JSON.parse(raw);
      console.log('✅ تم تحميل بيانات الفويس بنجاح');
    } else {
      voiceData = {};
    }
  } catch (e) {
    console.error('❌ خطأ في تحميل بيانات الفويس:', e);
    voiceData = {};
  }
}

function saveVoiceData() {
  try {
    fs.writeFileSync(voiceDataFile, JSON.stringify(voiceData, null, 2));
  } catch (e) {
    console.error('❌ خطأ في حفظ بيانات الفويس:', e);
  }
}

function getUserVoiceData(userId, guildId) {
  if (!voiceData[guildId]) voiceData[guildId] = {};
  if (!voiceData[guildId][userId]) {
    voiceData[guildId][userId] = { totalSeconds: 0 };
  }
  return voiceData[guildId][userId];
}

function onVoiceJoin(userId, guildId) {
  const key = `${guildId}:${userId}`;
  activeSessions[key] = Date.now();
}

function onVoiceLeave(userId, guildId) {
  const key = `${guildId}:${userId}`;
  const joinTime = activeSessions[key];
  if (!joinTime) return;
  const elapsed = Math.floor((Date.now() - joinTime) / 1000);
  delete activeSessions[key];
  const userData = getUserVoiceData(userId, guildId);
  userData.totalSeconds += elapsed;
  saveVoiceData();
}

function getUserVoiceSeconds(userId, guildId) {
  const userData = getUserVoiceData(userId, guildId);
  const key = `${guildId}:${userId}`;
  const extra = activeSessions[key] ? Math.floor((Date.now() - activeSessions[key]) / 1000) : 0;
  return userData.totalSeconds + extra;
}

function formatVoiceTime(seconds) {
  if (seconds < 60) return `${seconds}ث`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}د`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}س ${mins}د`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}ي ${hrs}س`;
}

function getTopVoiceUsers(guildId, limit = 10) {
  if (!voiceData[guildId]) return [];
  return Object.entries(voiceData[guildId])
    .map(([userId, data]) => {
      const key = `${guildId}:${userId}`;
      const extra = activeSessions[key] ? Math.floor((Date.now() - activeSessions[key]) / 1000) : 0;
      return { userId, totalSeconds: data.totalSeconds + extra };
    })
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, limit);
}

function resetVoiceTime(guildId) {
  voiceData[guildId] = {};
  saveVoiceData();
}

module.exports = {
  loadVoiceData,
  saveVoiceData,
  onVoiceJoin,
  onVoiceLeave,
  getUserVoiceSeconds,
  formatVoiceTime,
  getTopVoiceUsers,
  resetVoiceTime
};
