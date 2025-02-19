const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pingme')
    .setDescription('Toggle automatic DM notifications for your rally times'),
  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      const userId = interaction.user.id;

      // Initialize wantsDM tracking if it doesn't exist
      if (!offsets.wantsDM) {
        offsets.wantsDM = {};
      }
      if (!offsets.wantsDM[guildId]) {
        offsets.wantsDM[guildId] = {};
      }

      // Toggle the user's DM preference
      const currentSetting = offsets.wantsDM[guildId][userId];
      if (currentSetting) {
        delete offsets.wantsDM[guildId][userId];
        await saveOffsets();
        await interaction.reply({
          content: '❌ You will no longer receive DM notifications for rally times.',
          flags: 64
        });
      } else {
        offsets.wantsDM[guildId][userId] = true;
        await saveOffsets();
        await interaction.reply({
          content: '✅ You will now receive DM notifications 2 seconds before your rally launch times!\n\nMake sure you have DMs enabled for this server.',
          flags: 64
        });
      }
    } catch (error) {
      console.error('Error in pingme command:', error);
      // Only try to reply if we haven't already
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'There was an error processing your command. Please try again.',
          flags: 64
        }).catch(console.error);
      }
    }
  },
}; 