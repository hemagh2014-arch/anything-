const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUsers, resetXP } = require('../../utils/xp');
const { getTopVoiceUsers, formatVoiceTime, resetVoiceTime } = require('../../utils/voiceTime');
const { isDeveloper } = require('../../utils/security');

const PERIOD_LABELS = {
  daily: '📅 اليوم',
  weekly: '📆 آخر 7 أيام',
  monthly: '🗓️ آخر 30 يوم',
  alltime: '🌐 منذ البداية'
};

const PERIOD_CHOICES = [
  { name: 'منذ البداية (الكل)', value: 'alltime' },
  { name: 'اليوم', value: 'daily' },
  { name: 'آخر 7 أيام', value: 'weekly' },
  { name: 'آخر 30 يوم', value: 'monthly' }
];

const TOP_SIZE = 5;
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('عرض التوب | Shows the leaderboard')
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('عرض توب الرسائل والـ XP')
        .addStringOption(opt =>
          opt.setName('period')
            .setDescription('الفترة الزمنية')
            .setRequired(false)
            .addChoices(...PERIOD_CHOICES)
        )
    )
    .addSubcommand(sub =>
      sub.setName('xp')
        .setDescription('عرض توب الـ XP والرسائل')
        .addStringOption(opt =>
          opt.setName('period')
            .setDescription('الفترة الزمنية')
            .setRequired(false)
            .addChoices(...PERIOD_CHOICES)
        )
    )
    .addSubcommand(sub =>
      sub.setName('voice')
        .setDescription('عرض توب الفويس')
        .addStringOption(opt =>
          opt.setName('period')
            .setDescription('الفترة الزمنية')
            .setRequired(false)
            .addChoices(...PERIOD_CHOICES)
        )
    )
    .addSubcommand(sub =>
      sub.setName('restart')
        .setDescription('إعادة تعيين التوب (للمطورين) | Restart the leaderboard (Devs only)')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const period = interaction.options.getString('period') || 'alltime';

    if (subcommand === 'show' || subcommand === 'xp') {
      await this.showXPTop(interaction, interaction.guild, period, interaction.user.id);
    } else if (subcommand === 'voice') {
      await this.showVoiceTop(interaction, interaction.guild, period, interaction.user.id);
    } else if (subcommand === 'restart') {
      if (!isDeveloper(interaction.user.id)) {
        return interaction.reply({ content: '❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!', ephemeral: true });
      }
      resetXP(interaction.guild.id);
      resetVoiceTime(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔄 تم إعادة تعيين التوب')
        .setDescription(`تم إعادة تعيين جميع بيانات XP والفويس في السيرفر **${interaction.guild.name}**`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },

  async executeMessage(message, args) {
    if (message.content === '+restarttop') {
      if (!isDeveloper(message.author.id)) {
        return message.reply('❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!');
      }
      resetXP(message.guild.id);
      resetVoiceTime(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔄 تم إعادة تعيين التوب')
        .setDescription(`تم إعادة تعيين جميع بيانات XP والفويس في السيرفر **${message.guild.name}**`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const subArg = (args[0] || '').toLowerCase();
    const periodArg = (args[1] || args[0] || '').toLowerCase();
    const periodMap = {
      daily: 'daily', اليوم: 'daily',
      weekly: 'weekly', اسبوعي: 'weekly', أسبوعي: 'weekly',
      monthly: 'monthly', شهري: 'monthly',
      alltime: 'alltime', كل: 'alltime', الكل: 'alltime'
    };
    const period = periodMap[periodArg] || periodMap[subArg] || 'alltime';

    if (subArg === 'voice' || subArg === 'فويس') {
      await this.showVoiceTop(message, message.guild, period, message.author.id);
    } else {
      await this.showXPTop(message, message.guild, period, message.author.id);
    }
  },

  async showXPTop(target, guild, period = 'alltime', callerId = null) {
    try {
      await (target.deferReply ? target.deferReply() : Promise.resolve());

      // Get top 5 + full list to find caller rank
      const allUsers = getTopUsers(guild.id, 500, period);
      const top5 = allUsers.slice(0, TOP_SIZE);
      const periodLabel = PERIOD_LABELS[period] || PERIOD_LABELS.alltime;

      if (top5.length === 0) {
        const reply = `❌ لا يوجد نشاط في الفترة المحددة (${periodLabel})!`;
        if (target.editReply) return target.editReply(reply);
        return target.channel.send(reply);
      }

      let description = '';
      for (let i = 0; i < top5.length; i++) {
        const user = top5[i];
        const member = await guild.members.fetch(user.userId).catch(() => null);
        const userName = member ? member.user.username : `Unknown (${user.userId})`;
        const mention = member ? member.toString() : `Unknown (${user.userId})`;
        description += `${MEDALS[i]} **${userName}** ${mention}\n`;
        description += `┣ 📨 الرسائل: **${user.periodMessages}**\n`;
        if (period === 'alltime') {
          description += `┗ ⭐ XP: **${user.xp}** | المستوى: **${user.level}**\n\n`;
        } else {
          description += `┗ 🌐 إجمالي الرسائل: **${user.totalMessages}**\n\n`;
        }
      }

      // Check if caller is in top 5
      const callerInTop = callerId && top5.some(u => u.userId === callerId);
      if (callerId && !callerInTop) {
        const callerRank = allUsers.findIndex(u => u.userId === callerId);
        if (callerRank !== -1) {
          const callerData = allUsers[callerRank];
          const callerMember = await guild.members.fetch(callerId).catch(() => null);
          const callerName = callerMember ? callerMember.user.username : `Unknown`;
          const callerMention = callerMember ? callerMember.toString() : `Unknown`;
          description += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;
          description += `**#${callerRank + 1}** ${callerName} ${callerMention}\n`;
          description += `┣ 📨 الرسائل: **${callerData.periodMessages}**\n`;
          if (period === 'alltime') {
            description += `┗ ⭐ XP: **${callerData.xp}** | المستوى: **${callerData.level}**\n`;
          } else {
            description += `┗ 🌐 إجمالي: **${callerData.totalMessages}**\n`;
          }
        } else {
          description += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;
          description += `لم يتم تسجيل نشاط لك في هذه الفترة بعد.`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle(`🏆 التوب الكتابي — ${periodLabel}`)
        .setDescription(description)
        .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
        .setTimestamp();

      if (target.editReply) await target.editReply({ embeds: [embed] });
      else await target.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Top XP command error:', error);
      const reply = '❌ حدث خطأ في عرض التوب!';
      if (target.editReply) await target.editReply(reply).catch(() => target.reply(reply));
      else await target.channel.send(reply);
    }
  },

  async showVoiceTop(target, guild, period = 'alltime', callerId = null) {
    try {
      await (target.deferReply ? target.deferReply() : Promise.resolve());

      const allUsers = getTopVoiceUsers(guild.id, 500, period);
      const top5 = allUsers.slice(0, TOP_SIZE);
      const periodLabel = PERIOD_LABELS[period] || PERIOD_LABELS.alltime;

      if (top5.length === 0) {
        const reply = `❌ لا يوجد نشاط في الفويس في الفترة المحددة (${periodLabel})!`;
        if (target.editReply) return target.editReply(reply);
        return target.channel.send(reply);
      }

      let description = '';
      for (let i = 0; i < top5.length; i++) {
        const user = top5[i];
        const member = await guild.members.fetch(user.userId).catch(() => null);
        const userName = member ? member.user.username : `Unknown (${user.userId})`;
        const mention = member ? member.toString() : `Unknown (${user.userId})`;
        description += `${MEDALS[i]} **${userName}** ${mention}\n`;
        description += `┗ 🎙️ وقت الفويس: **${formatVoiceTime(user.totalSeconds)}**\n\n`;
      }

      // Check if caller is in top 5
      const callerInTop = callerId && top5.some(u => u.userId === callerId);
      if (callerId && !callerInTop) {
        const callerRank = allUsers.findIndex(u => u.userId === callerId);
        if (callerRank !== -1) {
          const callerData = allUsers[callerRank];
          const callerMember = await guild.members.fetch(callerId).catch(() => null);
          const callerName = callerMember ? callerMember.user.username : `Unknown`;
          const callerMention = callerMember ? callerMember.toString() : `Unknown`;
          description += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;
          description += `**#${callerRank + 1}** ${callerName} ${callerMention}\n`;
          description += `┗ 🎙️ وقت الفويس: **${formatVoiceTime(callerData.totalSeconds)}**\n`;
        } else {
          description += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;
          description += `لم يتم تسجيل وقت فويس لك في هذه الفترة بعد.`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle(`🎙️ توب الفويس — ${periodLabel}`)
        .setDescription(description)
        .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
        .setTimestamp();

      if (target.editReply) await target.editReply({ embeds: [embed] });
      else await target.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Top voice command error:', error);
      const reply = '❌ حدث خطأ في عرض توب الفويس!';
      if (target.editReply) await target.editReply(reply).catch(() => target.reply(reply));
      else await target.channel.send(reply);
    }
  }
};
