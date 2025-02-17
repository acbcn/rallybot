const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite URL'),
  async execute(interaction) {
    const clientId = process.env.CLIENT_ID;
    // Permissions:
    // - View Channels (1024)
    // - Send Messages (2048)
    // - Add Reactions (64)
    // - Use External Emojis (262144)
    const permissions = 1024 + 2048 + 64 + 262144; // = 265280
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
    
    await interaction.reply({
      content: `You can invite the bot to other servers using this link:\n${inviteUrl}\n\nThe bot can also be added directly through Discord's App Directory.`,
      ephemeral: true
    });
  },
}; 