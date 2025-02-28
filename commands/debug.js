const { SlashCommandBuilder } = require('discord.js');
const { offsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Debug command to check offsets data'),
  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      
      // Create a formatted representation of the offsets data
      let debugInfo = '**Current Offsets Data:**\n\n';
      
      // Check if guild has any data
      if (!offsets[guildId]) {
        return await interaction.reply({
          content: 'No data exists for this server.',
          ephemeral: true
        });
      }
      
      // Alliance data
      debugInfo += '**Alliances:**\n';
      for (const [alliance, users] of Object.entries(offsets[guildId])) {
        debugInfo += `Alliance **${alliance}**:\n`;
        for (const [userId, offset] of Object.entries(users)) {
          const displayName = userId.startsWith('NONDISCORD:') 
            ? userId.replace('NONDISCORD:', '') 
            : `<@${userId}>`;
          debugInfo += `- ${displayName}: ${offset}s\n`;
        }
        debugInfo += '\n';
      }
      
      // Wave configuration
      if (offsets.waves && offsets.waves[guildId]) {
        debugInfo += '**Wave Configurations:**\n';
        for (const [alliance, waves] of Object.entries(offsets.waves[guildId])) {
          debugInfo += `Alliance **${alliance}** waves:\n`;
          for (const [waveNum, offset] of Object.entries(waves)) {
            debugInfo += `- Wave ${waveNum}: ${offset}s offset\n`;
          }
          debugInfo += '\n';
        }
      } else {
        debugInfo += '**No wave configurations found.**\n\n';
      }
      
      // User wave assignments
      if (offsets.userWaves && offsets.userWaves[guildId]) {
        debugInfo += '**User Wave Assignments:**\n';
        for (const [alliance, users] of Object.entries(offsets.userWaves[guildId])) {
          debugInfo += `Alliance **${alliance}** assignments:\n`;
          for (const [userId, waveNum] of Object.entries(users)) {
            const displayName = userId.startsWith('NONDISCORD:') 
              ? userId.replace('NONDISCORD:', '') 
              : `<@${userId}>`;
            debugInfo += `- ${displayName}: Wave ${waveNum}\n`;
          }
          debugInfo += '\n';
        }
      } else {
        debugInfo += '**No user wave assignments found.**\n';
      }
      
      // Send the debug info
      await interaction.reply({
        content: debugInfo,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in debug command:', error);
      await interaction.reply({
        content: 'Error retrieving debug information.',
        ephemeral: true
      });
    }
  },
}; 