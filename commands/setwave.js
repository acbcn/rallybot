const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwave')
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
      let allianceInput = interaction.options.getString('alliance');
      
      // Extract only the first 3 characters for alliance code
      // This handles cases where users type "NWO wave:1" as the alliance
      let alliance = '';
      let extractedWave = null;
      let wasAllianceTrimmed = false;
      
      if (allianceInput && allianceInput.length > 0) {
        // Take up to the first 3 characters and convert to uppercase
        alliance = allianceInput.substring(0, 3).toUpperCase();
        
        // Check if the input contains "wave:" to extract wave number
        const waveMatch = allianceInput.match(/wave:(\d+)/i);
        if (waveMatch && waveMatch[1]) {
          extractedWave = parseInt(waveMatch[1], 10);
          console.log(`Extracted wave ${extractedWave} from alliance input "${allianceInput}"`);
        }
        
        // If the alliance input contains more than 3 characters or includes "wave:"
        if (allianceInput.length > 3 || allianceInput.toLowerCase().includes('wave:')) {
          console.log(`Alliance input "${allianceInput}" was trimmed to "${alliance}"`);
          wasAllianceTrimmed = true;
        }
      } else {
        return interaction.reply({
          content: '⚠️ **Error**: Alliance abbreviation is required.\n\n' +
                  'Please provide a 3-letter alliance abbreviation.',
          ephemeral: true
        });
      }
      
      // Get wave parameter and ensure it's properly handled
      // If wave was explicitly provided, use that; otherwise use the extracted wave
      let waveNumber = interaction.options.getInteger('wave');
      if (waveNumber === null && extractedWave !== null) {
        waveNumber = extractedWave;
        console.log(`Using wave ${waveNumber} extracted from alliance input`);
      }
      
      const timeOffset = interaction.options.getInteger('offset');

      // Debug logging
      console.log('setwave command parameters:');
      console.log(`Guild ID: ${guildId}`);
      console.log(`Alliance (raw): ${allianceInput}`);
      console.log(`Alliance (trimmed): ${alliance}`);
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
      
      // If the alliance was trimmed, add a note about it
      if (wasAllianceTrimmed) {
        responseMsg += `\n\n⚠️ Note: Your alliance input "${allianceInput}" was automatically trimmed to "${alliance}".`;
      }
      
      responseMsg += `\n\nTo assign users to this wave, use:\n\`/settime seconds:10 alliance:${alliance} wave:${waveNumber}\``;

      await interaction.reply({
        content: responseMsg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in setwave command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command. Make sure to use the correct format:\n\n' +
                  '⚠️ **Important**: Discord slash commands require you to use the parameter names exactly as shown.\n' +
                  '✅ Correct: `/setwave alliance:NWO wave:1 offset:15`\n' +
                  '❌ Incorrect: `/setwave NWO wave:1 offset:15`', 
          ephemeral: true 
        });
      }
    }
  },
}; 