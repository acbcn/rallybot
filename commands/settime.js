// settime.js
const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settime')
    .setDescription('Set your march time to center and which alliance you are in.')
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('March Time in seconds.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation.')
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      // Defer the reply immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;
      const guildId = interaction.guildId;
      const neededSeconds = interaction.options.getInteger('seconds');
      const alliance = interaction.options.getString('alliance').toUpperCase();

      // Initialize nested objects safely
      offsets[guildId] = offsets[guildId] || {};
      offsets[guildId][alliance] = offsets[guildId][alliance] || {};

      // Remove user from old alliances in this guild
      for (const ally in offsets[guildId]) {
        if (ally !== alliance && offsets[guildId][ally]?.[userId]) {
          delete offsets[guildId][ally][userId];
        }
      }

      // Set the user's offset
      offsets[guildId][alliance][userId] = neededSeconds;

      // Save changes to JSON
      try {
        saveOffsets();
      } catch (saveError) {
        console.error('Error saving offsets:', saveError);
        await interaction.editReply('There was an error saving your time. Please try again.');
        return;
      }

      // Use editReply since we deferred earlier
      await interaction.editReply(
        `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`
      );
    } catch (error) {
      console.error('Error in settime command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your command.', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'There was an error processing your command.', ephemeral: true });
      }
    }
  },
};