const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUsers, resetXP } = require('../../utils/xp');
const { getTopVoiceUsers, formatVoiceTime, resetVoiceTime } = require('../../utils/voiceTime');
const { isDeveloper } = require('../../utils/security');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('عرض التوب | Shows the leaderboard')
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('عرض التوب الكامل | Show the full leaderboard')
    )
    .addSubcommand(sub =>
      sub.setName('xp')
        .setDescription('عرض توب الـ XP والرسائل | Show XP & messages leaderboard')
    )
    .addSubcommand(sub =>
      sub.setName('voice')
        .setDescription('عرض توب الفويس | Show voice time leaderboard')
    )
    .addSubcommand(sub =>
      sub.setName('restart')
        .setDescription('إعادة تعيين التوب (للمطورين) | Restart the leaderboard (Devs only)')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'show' || subcommand === 'xp') {
      await this.showXPTop(interaction, interaction.guild);
    } else if (subcommand === 'voice') {
      await this.showVoiceTop(interaction, interaction.guild);
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

    await this.showXPTop(message, message.guild);
  },

  async showXPTop(target, guild) {
    try {
      const topUsers = getTopUsers(guild.id, 10);

      if (topUsers.length === 0) {
        const reply = '❌ لا يوجد مستخدمين في التوب بعد!';
        if (target.reply) return target.reply(reply);
        return target.channel.send(reply);
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      let description = '';

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const member = await guild.members.fetch(user.userId).catch(() => null);
        const userName = member ? member.user.username : `Unknown (${user.userId})`;
        const mention = member ? member.toString() : `Unknown (${user.userId})`;
        description += `${medals[i]} **${userName}** ${mention}\n`;
        description += `┣ 📨 الرسائل: **${user.totalMessages}**\n`;
        description += `┗ ⭐ الـ XP: **${user.xp}** | المستوى: **${user.level}**\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🏆 التوب الكتابي - أكثر 10 متفاعلين')
        .setDescription(description)
        .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
        .setTimestamp();

      if (target.reply) await target.reply({ embeds: [embed] });
      else await target.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Top XP command error:', error);
      const reply = '❌ حدث خطأ في عرض التوب!';
      if (target.reply) await target.reply(reply);
      else await target.channel.send(reply);
    }
  },

  async showVoiceTop(target, guild) {
    try {
      const topUsers = getTopVoiceUsers(guild.id, 10);

      if (topUsers.length === 0) {
        const reply = '❌ لا يوجد مستخدمين في توب الفويس بعد!';
        if (target.reply) return target.reply(reply);
        return target.channel.send(reply);
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      let description = '';

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const member = await guild.members.fetch(user.userId).catch(() => null);
        const userName = member ? member.user.username : `Unknown (${user.userId})`;
        const mention = member ? member.toString() : `Unknown (${user.userId})`;
        description += `${medals[i]} **${userName}** ${mention}\n`;
        description += `┗ 🎙️ وقت الفويس: **${formatVoiceTime(user.totalSeconds)}**\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🎙️ توب الفويس - أكثر 10 في الرومات')
        .setDescription(description)
        .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
        .setTimestamp();

      if (target.reply) await target.reply({ embeds: [embed] });
      else await target.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Top voice command error:', error);
      const reply = '❌ حدث خطأ في عرض توب الفويس!';
      if (target.reply) await target.reply(reply);
      else await target.channel.send(reply);
    }
  }
};
