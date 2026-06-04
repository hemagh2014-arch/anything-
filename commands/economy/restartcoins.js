const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { resetAllCoins, resetCoins } = require('../../utils/coins');
const { isDeveloper } = require('../../utils/security');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restartcoins')
        .setDescription('إعادة تعيين العملات (للمطورين) | Restart coins (Devs only)')
        .addSubcommand(sub =>
            sub.setName('all')
                .setDescription('إعادة تعيين جميع العملات | Restart all coins')
        )
        .addSubcommand(sub =>
            sub.setName('user')
                .setDescription('إعادة تعيين عملات مستخدم | Restart a user\'s coins')
                .addUserOption(opt => opt.setName('target').setDescription('المستخدم | The user').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!isDeveloper(interaction.user.id)) {
            return interaction.reply({ content: '❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'all') {
            resetAllCoins();
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔄 تم إعادة تعيين جميع العملات')
                .setDescription(`تم إعادة تعيين جميع العملات للجميع بنجاح!`)
                .addFields(
                    { name: 'بواسطة', value: interaction.user.tag, inline: true },
                    { name: 'الوقت', value: new Date().toLocaleString('en-US'), inline: true }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'user') {
            const targetUser = interaction.options.getUser('target');
            resetCoins(targetUser.id);
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔄 تم إعادة تعيين العملات')
                .setDescription(`تم إعادة تعيين جميع العملات للمستخدم ${targetUser} بنجاح!`)
                .addFields(
                    { name: 'المستخدم', value: targetUser.tag, inline: true },
                    { name: 'بواسطة', value: interaction.user.tag, inline: true },
                    { name: 'الوقت', value: new Date().toLocaleString('en-US'), inline: true }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
    },

    async executeMessage(message, args) {
        if (!isDeveloper(message.author.id)) {
            return message.reply('❌ المبرمج فقط من يستطيع إستخدام هذا الأمر!');
        }

        if (message.content === '+restartcall') {
            resetAllCoins();
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔄 تم إعادة تعيين جميع العملات')
                .setDescription(`تم إعادة تعيين جميع العملات للجميع بنجاح!`)
                .addFields(
                    { name: 'بواسطة', value: message.author.tag, inline: true },
                    { name: 'الوقت', value: new Date().toLocaleString('en-US'), inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (message.content.startsWith('+restartc')) {
            const userArgs = message.content.slice(10).trim().split(/ +/);
            if (userArgs.length < 1) {
                return message.reply('❌ الاستخدام الصحيح: +restartc @منشن أو +restartc ايدي_الشخص');
            }

            let targetUser;
            if (message.mentions.users.size > 0) {
                targetUser = message.mentions.users.first();
            } else {
                const userId = userArgs[0];
                targetUser = await message.client.users.fetch(userId).catch(() => null);
            }

            if (!targetUser) {
                return message.reply('❌ لم أستطع العثور على المستخدم!');
            }

            resetCoins(targetUser.id);
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🔄 تم إعادة تعيين العملات')
                .setDescription(`تم إعادة تعيين جميع العملات للمستخدم ${targetUser} بنجاح!`)
                .addFields(
                    { name: 'المستخدم', value: targetUser.tag, inline: true },
                    { name: 'بواسطة', value: message.author.tag, inline: true },
                    { name: 'الوقت', value: new Date().toLocaleString('en-US'), inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
    }
};
