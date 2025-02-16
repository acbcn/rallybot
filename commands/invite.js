const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite URL'),
  async execute(interaction) {
    const clientId = process.env.CLIENT_ID;
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=applications.commands%20bot&permissions=277025392640`;
    
    await interaction.reply({
      content: `You can invite the bot to other servers using this link:\n${inviteUrl}\n\nMake sure the bot is set as "Public Bot" in the Discord Developer Portal under "Bot" settings.`,
      ephemeral: true
    });
  },
}; 