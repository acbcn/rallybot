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
    try {
      const guildId = interaction.guildId;
      const alliance = interaction.options.getString('alliance')?.toUpperCase();

      // Check if guild has any data
      if (!offsets[guildId]) {
        return interaction.reply({
          content: 'No data exists for this server.',
          ephemeral: true
        });
      }

      if (alliance) {
        // Clear specific alliance
        if (!offsets[guildId][alliance]) {
          return interaction.reply({
            content: `No data found for alliance **${alliance}** in this server.`,
            ephemeral: true
          });
        }

        delete offsets[guildId][alliance];
        await interaction.reply({
          content: `Cleared all data for alliance **${alliance}** in this server.`,
          ephemeral: true
        });
      } else {
        // Clear entire guild
        delete offsets[guildId];
        await interaction.reply({
          content: 'Cleared all rally data for this server.',
          ephemeral: true
        });
      }

      // Save changes
      saveOffsets();
    } catch (error) {
      console.error('Error in clear command:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: 'There was an error processing your command.',
          ephemeral: true
        });
      }
    }
  },
}; 