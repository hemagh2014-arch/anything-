const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { loadEmbeds, buildEmbed, buildButtons } = require('../../utils/embedHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('إرسال إيمبيد إلى قناة معينة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('إرسال إيمبيد محفوظ إلى قناة')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('القناة التي سيتم الإرسال إليها')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('اسم الإيمبيد المحفوظ')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('عرض قائمة الإيمبيدات المحفوظة')),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const embeds = loadEmbeds();
    const choices = embeds
      .filter(e => e.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(e => ({ name: e.name, value: e.name }));
    await interaction.respond(choices);
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const embeds = loadEmbeds();
      if (!embeds.length) {
        return interaction.reply({
          content: '❌ لا توجد إيمبيدات محفوظة بعد. استخدم الداشبورد لإضافة إيمبيدات.',
          ephemeral: true
        });
      }
      const list = embeds
        .map((e, i) => `**${i + 1}.** ${e.name}${e.hasButtons ? ` (${e.buttons?.length || 0} أزرار)` : ''}`)
        .join('\n');
      return interaction.reply({
        content: `📋 **الإيمبيدات المحفوظة:**\n${list}`,
        ephemeral: true
      });
    }

    if (sub === 'send') {
      const channel = interaction.options.getChannel('channel');
      const name = interaction.options.getString('name');

      const embeds = loadEmbeds();
      const config = embeds.find(e => e.name.toLowerCase() === name.toLowerCase());

      if (!config) {
        return interaction.reply({
          content: `❌ لم يتم العثور على إيمبيد باسم "${name}". استخدم **/embed list** لعرض الإيمبيدات المتاحة.`,
          ephemeral: true
        });
      }

      const embed = buildEmbed(config.embed);
      const row = buildButtons(config);

      const messageOptions = { embeds: [embed] };
      if (row) messageOptions.components = [row];

      await channel.send(messageOptions);
      await interaction.reply({
        content: `✅ تم إرسال الإيمبيد **${config.name}** إلى ${channel}`,
        ephemeral: true
      });
    }
  },

  async executeMessage(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ ليس لديك صلاحية استخدام هذا الأمر!');
    }
    const embeds = loadEmbeds();
    if (!embeds.length) {
      return message.reply('❌ لا توجد إيمبيدات محفوظة. استخدم الداشبورد لإضافة إيمبيدات.');
    }
    const list = embeds.map((e, i) => `**${i + 1}.** ${e.name}`).join('\n');
    message.reply(`📋 **الإيمبيدات المحفوظة:**\n${list}\n\nلإرسال إيمبيد: \`!embed send #القناة <اسم-الإيمبيد>\``);
  }
};
