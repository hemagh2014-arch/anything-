const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('مسح جميع رسائل القناة عن طريق إعادة إنشائها | Clear all messages by recreating the channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const channel = interaction.channel;
            const position = channel.position;
            const parent = channel.parent;

            const newChannel = await channel.clone();
            await channel.delete();

            await newChannel.setPosition(position);
            if (parent) await newChannel.setParent(parent);

            await newChannel.send({ content: '💥 تم عمل نيوك للقناة بنجاح! | Channel has been nuked!' });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ أثناء محاولة تنفيذ النيوك.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        try {
            const channel = message.channel;
            const position = channel.position;
            const parent = channel.parent;

            const newChannel = await channel.clone();
            await channel.delete();

            await newChannel.setPosition(position);
            if (parent) await newChannel.setParent(parent);

            await newChannel.send({ content: '💥 تم عمل نيوك للقناة بنجاح! | Channel has been nuked!' });
        } catch (error) {
            console.error(error);
        }
    }
};
