const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite URL'),
  async execute(interaction) {
    const clientId = process.env.CLIENT_ID;
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147483648&scope=bot%20applications.commands`;
    
    await interaction.reply({
      content: `You can invite the bot to other servers using this link:\n${inviteUrl}`,
      ephemeral: true
    });
  },
}; 