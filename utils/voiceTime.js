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

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getUserVoiceData(userId, guildId) {
  if (!voiceData[guildId]) voiceData[guildId] = {};
  if (!voiceData[guildId][userId]) {
    voiceData[guildId][userId] = { totalSeconds: 0, daily: {} };
  }
  if (!voiceData[guildId][userId].daily) {
    voiceData[guildId][userId].daily = {};
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

  // Track daily seconds
  const todayKey = getTodayKey();
  if (!userData.daily[todayKey]) userData.daily[todayKey] = 0;
  userData.daily[todayKey] += elapsed;

  // Keep only last 35 days
  const keys = Object.keys(userData.daily).sort();
  if (keys.length > 35) {
    keys.slice(0, keys.length - 35).forEach(k => delete userData.daily[k]);
  }

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

function getPeriodSeconds(userData, period, liveExtra = 0) {
  if (!period || period === 'alltime') return userData.totalSeconds + liveExtra;
  if (!userData.daily) return liveExtra;

  let startDate;
  const now = new Date();
  if (period === 'daily') {
    startDate = now.toISOString().slice(0, 10);
  } else if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === 'monthly') {
    const d = new Date(now);
    d.setDate(now.getDate() - 30);
    startDate = d.toISOString().slice(0, 10);
  }

  const fromDaily = Object.entries(userData.daily)
    .filter(([dateKey]) => dateKey >= startDate)
    .reduce((sum, [, secs]) => sum + secs, 0);

  // Add today's live session if period includes today
  return fromDaily + liveExtra;
}

function getTopVoiceUsers(guildId, limit = 10, period = 'alltime') {
  if (!voiceData[guildId]) return [];

  return Object.entries(voiceData[guildId])
    .map(([userId, data]) => {
      const key = `${guildId}:${userId}`;
      const liveExtra = activeSessions[key] ? Math.floor((Date.now() - activeSessions[key]) / 1000) : 0;
      const periodSeconds = getPeriodSeconds(data, period, liveExtra);
      return { userId, totalSeconds: periodSeconds };
    })
    .filter(u => u.totalSeconds > 0)
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
