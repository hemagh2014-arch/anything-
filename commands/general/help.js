const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض قائمة جميع الأوامر المتاحة | Shows all available commands'),

  async execute(interaction) {
    await interaction.deferReply();
    const commands = interaction.client.commands;
    const categories = {};

    commands.forEach(command => {
      const category = command.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(`\`/${command.data.name}\``);
    });

    const helpEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('✨ Bot Commands Menu')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.username} • Prefix: +`,
        iconURL: interaction.user.displayAvatarURL()
      });

    for (const [category, cmds] of Object.entries(categories)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const emoji = getCategoryEmoji(categoryName);
      helpEmbed.addFields({
        name: `${emoji} ${categoryName}`,
        value: cmds.join(', '),
        inline: false
      });
    }

    await interaction.editReply({ embeds: [helpEmbed] });
  },

  async executeMessage(message, args) {
    const commands = message.client.commands;
    const categories = {};

    commands.forEach(command => {
      const category = command.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(`\`+${command.data.name}\``);
    });

    const helpEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('✨ Bot Commands Menu')
      .setDescription('إليك قائمة بجميع الأوامر المتاحة في البوت مقسمة حسب الفئات\nHere are all available commands grouped by category:')
      .setThumbnail(message.client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.username} • Prefix: +`,
        iconURL: message.author.displayAvatarURL()
      });

    for (const [category, cmds] of Object.entries(categories)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const emoji = getCategoryEmoji(categoryName);
      helpEmbed.addFields({
        name: `${emoji} ${categoryName}`,
        value: cmds.join(', '),
        inline: false
      });
    }

    message.reply({ embeds: [helpEmbed] });
  }
};

function getCategoryEmoji(category) {
  const emojis = {
    'General': '🛠️',
    'Security': '🛡️',
    'Moderation': '⚖️',
    'Utility': '🧹',
    'Fun': '🎮',
    'Ticket': '🎫',
    'Economy': '💰',
    'Leveling': '📈'
  };
  return emojis[category] || '📁';
}
