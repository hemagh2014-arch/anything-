const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const autoResponsesPath = path.join(__dirname, '../../data/autoResponses.json');

function loadAutoResponses() {
  try {
    if (!fs.existsSync(autoResponsesPath)) {
      fs.writeFileSync(autoResponsesPath, '{}');
      return {};
    }
    const data = fs.readFileSync(autoResponsesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading auto responses:', error);
    return {};
  }
}

function saveAutoResponses(responses) {
  try {
    fs.writeFileSync(autoResponsesPath, JSON.stringify(responses, null, 2));
  } catch (error) {
    console.error('Error saving auto responses:', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoresponse')
    .setDescription('إدارة الردود التلقائية')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('إضافة رد تلقائي جديد')
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('الكلمة أو الجملة التي تؤدي للرد')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('response')
            .setDescription('الرد التلقائي')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('حذف رد تلقائي')
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('الكلمة أو الجملة المراد حذفها')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('عرض جميع الردود التلقائية')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('حذف جميع الردود التلقائية')
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const responses = loadAutoResponses();
    const guildId = interaction.guildId;

    if (!responses[guildId]) {
      responses[guildId] = {};
    }

    switch (subcommand) {
      case 'add': {
        const trigger = interaction.options.getString('trigger').toLowerCase();
        const response = interaction.options.getString('response');

        responses[guildId][trigger] = response;
        saveAutoResponses(responses);

        await interaction.reply({
          content: `✅ تم إضافة الرد التلقائي بنجاح!\n\n**الكلمة:** ${trigger}\n**الرد:** ${response}`,
          ephemeral: true
        });
        break;
      }

      case 'remove': {
        const trigger = interaction.options.getString('trigger').toLowerCase();

        if (!responses[guildId][trigger]) {
          await interaction.reply({
            content: '❌ هذا الرد التلقائي غير موجود!',
            ephemeral: true
          });
          return;
        }

        delete responses[guildId][trigger];
        saveAutoResponses(responses);

        await interaction.reply({
          content: `✅ تم حذف الرد التلقائي بنجاح!\n\n**الكلمة:** ${trigger}`,
          ephemeral: true
        });
        break;
      }

      case 'list': {
        const guildResponses = responses[guildId];
        const responseList = Object.entries(guildResponses);

        if (responseList.length === 0) {
          await interaction.reply({
            content: '❌ لا توجد ردود تلقائية في هذا السيرفر!',
            ephemeral: true
          });
          return;
        }

        const responseText = responseList
          .map(([trigger, response], index) => `${index + 1}. **${trigger}** → ${response}`)
          .join('\n');

        await interaction.reply({
          content: `📋 **قائمة الردود التلقائية (${responseList.length}):**\n\n${responseText}`,
          ephemeral: true
        });
        break;
      }

      case 'clear': {
        responses[guildId] = {};
        saveAutoResponses(responses);

        await interaction.reply({
          content: '✅ تم حذف جميع الردود التلقائية بنجاح!',
          ephemeral: true
        });
        break;
      }
    }
  }
};
