const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { claimDaily, getNextDailyTime } = require('../../utils/coins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('استلام الهدية اليومية | Claim your daily reward'),

    async execute(interaction) {
        try {
            const result = claimDaily(interaction.user.id);

            if (!result.success) {
                const nextDaily = getNextDailyTime(interaction.user.id);
                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('⏱️ الهدية اليومية')
                    .setDescription(result.message)
                    .addFields(
                        { name: 'الوقت المتبقي', value: nextDaily, inline: true }
                    )
                    .setTimestamp();
                return interaction.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🎉 تم استلام الهدية اليومية!')
                .setDescription(`مبروك **${interaction.user}**! لقد استلمت هديتك اليومية.`)
                .addFields(
                    { name: 'الهدية', value: `${result.coins} عملة`, inline: true },
                    { name: 'رصيدك الجديد', value: `${result.total.toLocaleString()} عملة`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Daily command error:', error);
            interaction.reply({ content: '❌ حدث خطأ في استلام الهدية اليومية!', ephemeral: true });
        }
    },

    async executeMessage(message, args) {
        try {
            const result = claimDaily(message.author.id);

            if (!result.success) {
                const nextDaily = getNextDailyTime(message.author.id);
                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('⏱️ الهدية اليومية')
                    .setDescription(result.message)
                    .addFields(
                        { name: 'الوقت المتبقي', value: nextDaily, inline: true }
                    )
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('🎉 تم استلام الهدية اليومية!')
                .setDescription(`مبروك **${message.author}**! لقد استلمت هديتك اليومية.`)
                .addFields(
                    { name: 'الهدية', value: `${result.coins} عملة`, inline: true },
                    { name: 'رصيدك الجديد', value: `${result.total.toLocaleString()} عملة`, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Daily command error:', error);
            message.reply('❌ حدث خطأ في استلام الهدية اليومية!');
        }
    }
};
