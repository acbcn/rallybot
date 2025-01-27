const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setothername')
    .setDescription('Set rally time for a non-Discord person.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Name or nickname of the person (no @ mention).')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('March time in seconds (how long they need to hit center).')
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
      // Gather inputs
      const personName = interaction.options.getString('name');
      const neededSeconds = interaction.options.getInteger('seconds');
      const alliance = interaction.options.getString('alliance').toUpperCase();
      const guildId = interaction.guildId;

      // Initialize nested objects safely
      offsets[guildId] = offsets[guildId] || {};
      offsets[guildId][alliance] = offsets[guildId][alliance] || {};

      // Create the non-Discord user key
      const key = `NONDISCORD:${personName}`;

      // Remove this person from other alliances in this guild if they exist
      for (const ally in offsets[guildId]) {
        if (ally !== alliance) {
          const existingKey = Object.keys(offsets[guildId][ally] || {})
            .find(k => k.startsWith('NONDISCORD:') && k.slice(10) === personName);
          if (existingKey) {
            delete offsets[guildId][ally][existingKey];
          }
        }
      }

      // Store offset
      offsets[guildId][alliance][key] = neededSeconds;

      // Save to JSON
      saveOffsets();

      await interaction.reply({
        content: `Set march time for **${personName}** in alliance **${alliance}** to **${neededSeconds} seconds**.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in setothername command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command.', 
          ephemeral: true 
        });
      }
    }
  },
};