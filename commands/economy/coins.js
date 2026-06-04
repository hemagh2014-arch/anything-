const { SlashCommandBuilder } = require('discord.js');
const { getUserCoins, canClaimDaily, getNextDailyTime } = require('../../utils/coins');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coins')
        .setDescription('عرض رصيدك من العملات | Shows your coins balance'),

    async execute(interaction) {
        const userData = getUserCoins(interaction.user.id);
        const canClaim = canClaimDaily(interaction.user.id);
        const nextDaily = getNextDailyTime(interaction.user.id);

        const dailyStatus = canClaim ? '✅ متاحة الآن' : `⏱️ بعد ${nextDaily}`;

        await interaction.reply({
            content: `💰 **${interaction.user}** رصيدك الحالي: **${userData.coins.toLocaleString()}** عملة\n\n🎁 الهدية اليومية: ${dailyStatus}\n💎 قيمة الهدية: ${config.coins.dailyReward} عملة`
        });
    },

    async executeMessage(message, args) {
        const userData = getUserCoins(message.author.id);
        const canClaim = canClaimDaily(message.author.id);
        const nextDaily = getNextDailyTime(message.author.id);

        const dailyStatus = canClaim ? '✅ متاحة الآن' : `⏱️ بعد ${nextDaily}`;

        await message.reply(`💰 **${message.author}** رصيدك الحالي: **${userData.coins.toLocaleString()}** عملة\n\n🎁 الهدية اليومية: ${dailyStatus}\n💎 قيمة الهدية: ${config.coins.dailyReward} عملة`);
    }
};
