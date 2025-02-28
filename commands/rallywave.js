const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rallywave')
    .setDescription('Set time offset for rally waves')
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Wave number (1, 2, 3, etc.)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('offset')
        .setDescription('Time offset in seconds (negative = earlier, positive = later)')
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      // Get inputs
      const guildId = interaction.guildId;
      const alliance = interaction.options.getString('alliance').toUpperCase();
      const waveNumber = interaction.options.getInteger('wave');
      const timeOffset = interaction.options.getInteger('offset');

      // Validate inputs
      if (waveNumber < 1) {
        return interaction.reply({
          content: 'Wave number must be 1 or greater.',
          ephemeral: true
        });
      }

      // Initialize wave offsets structure if it doesn't exist
      if (!offsets.waves) {
        offsets.waves = {};
      }
      if (!offsets.waves[guildId]) {
        offsets.waves[guildId] = {};
      }
      if (!offsets.waves[guildId][alliance]) {
        offsets.waves[guildId][alliance] = {};
      }

      // Set the wave offset
      offsets.waves[guildId][alliance][waveNumber] = timeOffset;

      // Save changes
      await saveOffsets();

      // Prepare response message
      let offsetText = timeOffset === 0 ? 'at the center time' :
                      timeOffset < 0 ? `${Math.abs(timeOffset)} seconds before center` :
                      `${timeOffset} seconds after center`;

      await interaction.reply({
        content: `Wave ${waveNumber} for alliance **${alliance}** will hit ${offsetText}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in rallywave command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command.', 
          ephemeral: true 
        });
      }
    }
  },
}; 