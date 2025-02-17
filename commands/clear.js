const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear rally data for this server')
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation to clear (leave empty to clear all alliances)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Requires "Manage Server" permission
  async execute(interaction) {
    // Defer the reply immediately to prevent timeout
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const guildId = interaction.guildId;
      const alliance = interaction.options.getString('alliance')?.toUpperCase();

      // Check if guild has any data
      if (!offsets[guildId]) {
        return await interaction.editReply({
          content: 'No data exists for this server.',
        });
      }

      if (alliance) {
        // Clear specific alliance
        if (!offsets[guildId][alliance]) {
          return await interaction.editReply({
            content: `No data found for alliance **${alliance}** in this server.`,
          });
        }

        delete offsets[guildId][alliance];
        // Save before responding
        await saveOffsets();
        await interaction.editReply({
          content: `Cleared all data for alliance **${alliance}** in this server.`,
        });
      } else {
        // Clear entire guild
        delete offsets[guildId];
        // Save before responding
        await saveOffsets();
        await interaction.editReply({
          content: 'Cleared all rally data for this server.',
        });
      }
    } catch (error) {
      console.error('Error in clear command:', error);
      // Always try to respond with an error message
      try {
        await interaction.editReply({
          content: 'There was an error processing your command.',
        });
      } catch (err) {
        console.error('Error sending error response:', err);
      }
    }
  },
}; 