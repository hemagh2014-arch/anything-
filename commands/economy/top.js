const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTopUsers, resetXP } = require('../../utils/xp');
const { isDeveloper } = require('../../utils/security');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('عرض التوب الكتابي | Shows the text leaderboard')
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('عرض التوب | Show the leaderboard')
    )
    .addSubcommand(sub =>
      sub.setName('restart')
        .setDescription('إعادة تعيين التوب (للمطورين) | Restart the leaderboard (Devs only)')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'show') {
      await this.showTop(interaction, interaction.guild);
    } else if (subcommand === 'restart') {
      if (!isDeveloper(interaction.user.id)) {
        return interaction.reply({ content: '❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!', ephemeral: true });
      }
      resetXP(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔄 تم إعادة تعيين التوب')
        .setDescription(`تم إعادة تعيين جميع بيانات XP في السيرفر **${interaction.guild.name}**`)
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
      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🔄 تم إعادة تعيين التوب')
        .setDescription(`تم إعادة تعيين جميع بيانات XP في السيرفر **${message.guild.name}**`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    await this.showTop(message, message.guild);
  },

  async showTop(target, guild) {
    try {
      const topUsers = getTopUsers(guild.id, 10);

      if (topUsers.length === 0) {
        return target.reply('❌ لا يوجد مستخدمين في التوب بعد!');
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('🏆 التوب الكتابي - أكثر 10 متفاعلين')
        .setDescription('أكثر الأعضاء تفاعلاً في السيرفر:')
        .setTimestamp();

      let description = '';
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const member = await guild.members.fetch(user.userId).catch(() => null);
        const userName = member ? member.user.tag : `Unknown (${user.userId})`;
        const userMention = member ? member.toString() : `Unknown (${user.userId})`;

        description += `${medals[i]} **${userName}**\n`;
        description += `   المستوى: **${user.level}** | الرسائل: **${user.totalMessages}**\n`;
        description += `   ${userMention}\n\n`;
      }

      embed.setDescription(description);
      if (target.reply) {
        await target.reply({ embeds: [embed] });
      } else {
        await target.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Top command error:', error);
      const reply = '❌ حدث خطأ في عرض التوب!';
      if (target.reply) await target.reply(reply);
      else await target.channel.send(reply);
    }
  }
};
