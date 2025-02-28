const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rallywave')
    .setDescription('Set time offset for rally waves')
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation (e.g., NWO)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Wave number (e.g., 1 for Wave 1)')
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

      // Debug logging
      console.log('rallywave command parameters:');
      console.log(`Guild ID: ${guildId}`);
      console.log(`Alliance (raw): ${interaction.options.getString('alliance')}`);
      console.log(`Alliance (uppercase): ${alliance}`);
      console.log(`Wave: ${waveNumber}`);
      console.log(`Offset: ${timeOffset}`);

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

      let responseMsg = `Wave ${waveNumber} for alliance **${alliance}** will hit ${offsetText}.`;
      responseMsg += `\n\nTo assign users to this wave, use:\n\`/settime seconds:10 alliance:${alliance} wave:${waveNumber}\``;

      await interaction.reply({
        content: responseMsg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in rallywave command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command. Make sure to use the correct format: `/rallywave alliance:NWO wave:1 offset:15`', 
          ephemeral: true 
        });
      }
    }
  },
}; 