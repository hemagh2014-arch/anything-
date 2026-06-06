const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const embedsPath = path.join(__dirname, '../data/embeds.json');

function loadEmbeds() {
  try {
    if (!fs.existsSync(embedsPath)) return [];
    return JSON.parse(fs.readFileSync(embedsPath, 'utf8'));
  } catch {
    return [];
  }
}

function buildEmbed(embedData) {
  const embed = new EmbedBuilder();
  if (embedData.title) embed.setTitle(embedData.title);
  if (embedData.description) embed.setDescription(embedData.description);
  if (embedData.color) {
    try {
      embed.setColor(embedData.color);
    } catch { /* ignore invalid color */ }
  }
  if (embedData.footerText) embed.setFooter({ text: embedData.footerText });
  if (embedData.authorName) embed.setAuthor({ name: embedData.authorName });
  if (embedData.imageUrl) embed.setImage(embedData.imageUrl);
  if (embedData.thumbnailUrl) embed.setThumbnail(embedData.thumbnailUrl);
  if (embedData.fields?.length) embed.addFields(embedData.fields);
  return embed;
}

function buildButtons(config) {
  if (!config.hasButtons || !config.buttons?.length) return null;
  const styleMap = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger
  };
  const buttons = config.buttons.map(btn =>
    new ButtonBuilder()
      .setCustomId(`embed_btn_${config.id}_${btn.id}`)
      .setLabel(btn.label)
      .setStyle(styleMap[btn.style] || ButtonStyle.Primary)
  );
  return new ActionRowBuilder().addComponents(buttons);
}

async function handleEmbedButton(interaction) {
  // customId format: embed_btn_<configId>_<buttonId>
  const raw = interaction.customId; // embed_btn_UUID_BTNID
  const prefix = 'embed_btn_';
  const rest = raw.slice(prefix.length); // UUID_BTNID
  // UUIDs are 36 chars
  const configId = rest.slice(0, 36);
  const buttonId = rest.slice(37); // skip the underscore

  const embeds = loadEmbeds();
  const config = embeds.find(e => e.id === configId);
  if (!config) {
    return interaction.reply({
      content: '❌ تعذر العثور على الإعداد المرتبط بهذا الزر.',
      ephemeral: true
    });
  }

  const button = config.buttons.find(b => b.id === buttonId);
  if (!button || !button.responseEmbed) {
    return interaction.reply({
      content: '❌ لا يوجد رد مرتبط بهذا الزر.',
      ephemeral: true
    });
  }

  const embed = buildEmbed(button.responseEmbed);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { loadEmbeds, buildEmbed, buildButtons, handleEmbedButton };
