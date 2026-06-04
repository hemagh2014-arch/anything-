const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isDeveloper, initGuildData, createBackups, notifyAndLog } = require('../../utils/security');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('togglepro')
        .setDescription('تفعيل/تعطيل الحماية الكاملة (للمطورين) | Enable/Disable full protection (Devs only)')
        .addBooleanOption(opt => opt.setName('enable').setDescription('تفعيل أو تعطيل | Enable or Disable').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!isDeveloper(interaction.user.id)) {
            return interaction.reply({ content: '❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!', ephemeral: true });
        }

        const enable = interaction.options.getBoolean('enable');
        const guild = interaction.guild;
        const guildData = initGuildData(guild.id);

        if (!guildData || !guildData.protection) {
            return interaction.reply({ content: '❌ حدث خطأ في تحميل بيانات الحماية.', ephemeral: true });
        }

        Object.keys(guildData.protection).forEach(key => guildData.protection[key] = enable);

        if (enable) await createBackups(guild);
        const embed = new EmbedBuilder()
            .setTitle(enable ? '🛡️ Protection Activated ' : '🔴 Protection Disabled')
            .setDescription(`بواسطة المطور ${interaction.user.tag}.`)
            .setColor(0xFFFFFF);

        await interaction.reply({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
            .setTitle(enable ? '🛡️ تم تفعيل نظام الحماية' : '🔴 تم تعطيل نظام الحماية')
            .setDescription(`**المطور:** ${interaction.user.tag} (${interaction.user.id})\n**السيرفر:** ${guild.name}\n**الوقت:** ${new Date().toLocaleString('en-US')}`)
            .setColor(0xFFFFFF)
            .setTimestamp();
        await notifyAndLog(guild, logEmbed);
    },

    async executeMessage(message, args) {
        if (!isDeveloper(message.author.id)) return message.reply('❌ المبرمج فقط من يستطيع إستخدام هذا الأمر ');
        const enable = message.content === '+onpro';
        const guild = message.guild;
        const guildData = initGuildData(guild.id);

        if (!guildData || !guildData.protection) {
            return message.reply('❌ حدث خطأ في تحميل بيانات الحماية.');
        }

        Object.keys(guildData.protection).forEach(key => guildData.protection[key] = enable);

        if (enable) await createBackups(guild);
        const embed = new EmbedBuilder()
            .setTitle(enable ? '🛡️ Protection Activated ' : '🔴 Protection Disabled')
            .setDescription(`بواسطة المطور ${message.author.tag}.`)
            .setColor(0xFFFFFF);
        message.reply({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
            .setTitle(enable ? '🛡️ تم تفعيل نظام الحماية' : '🔴 تم تعطيل نظام الحماية')
            .setDescription(`**المطور:** ${message.author.tag} (${message.author.id})\n**السيرفر:** ${message.guild.name}\n**الوقت:** ${new Date().toLocaleString('en-US')}`)
            .setColor(0xFFFFFF)
            .setTimestamp();
        await notifyAndLog(message.guild, logEmbed);
    }
};
