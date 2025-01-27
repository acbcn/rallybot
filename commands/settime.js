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
      saveOffsets();

      await interaction.reply({
        content: `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in settime command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command.', 
          ephemeral: true 
        });
      }
    }
  },
};