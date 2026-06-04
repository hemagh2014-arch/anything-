const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('إضافة أو سحب رتبة من عضو | Add or remove a role from a user')
        .addUserOption(opt => opt.setName('target').setDescription('العضو | The user').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('الرتبة | The role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');

        if (!target) return interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', flags: [MessageFlags.Ephemeral] });

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: '❌ لا يمكنني التحكم بهذه الرتبة لأنها أعلى من رتبتي.', flags: [MessageFlags.Ephemeral] });
        }

        try {
            if (target.roles.cache.has(role.id)) {
                await target.roles.remove(role);
                await interaction.reply({ content: `✅ تم سحب رتبة **${role.name}** من **${target.user.tag}**.` });
            } else {
                await target.roles.add(role);
                await interaction.reply({ content: `✅ تم منح رتبة **${role.name}** لـ **${target.user.tag}**.` });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ حدث خطأ أثناء تعديل الرتب.', flags: [MessageFlags.Ephemeral] });
        }
    },

    async executeMessage(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return;

        const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) return message.reply('❌ يرجى منشن العضو أو كتابة الأيدي.');

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) return message.reply('❌ يرجى منشن الرتبة أو كتابة الأيدي الخاص بها.');

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('❌ لا يمكنني التحكم بهذه الرتبة.');
        }

        try {
            if (target.roles.cache.has(role.id)) {
                await target.roles.remove(role);
                message.reply(`✅ تم سحب رتبة **${role.name}** من **${target.user.tag}**.`);
            } else {
                await target.roles.add(role);
                message.reply(`✅ تم منح رتبة **${role.name}** لـ **${target.user.tag}**.`);
            }
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ.');
        }
    }
};
