const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setother')
    .setDescription('Set march time for someone else.')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Name of the person (e.g., PlayerName)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('Their march time in seconds (e.g., 10 for 10 seconds)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('Their 3-letter alliance abbreviation (e.g., NWO)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Wave number for coordinated attacks (e.g., 1 for Wave 1)')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      // Log the raw interaction options for debugging
      console.log('Raw interaction options:');
      console.log(interaction.options._hoistedOptions);
      
      // Gather inputs
      const personName = interaction.options.getString('name');
      const neededSeconds = interaction.options.getInteger('seconds');
      let allianceInput = interaction.options.getString('alliance');
      const guildId = interaction.guildId;
      
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
      let wave = interaction.options.getInteger('wave');
      if (wave === null && extractedWave !== null) {
        wave = extractedWave;
        console.log(`Using wave ${wave} extracted from alliance input`);
      }

      // Debug logging
      console.log('setother command parameters:');
      console.log(`Person Name: ${personName}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${allianceInput}`);
      console.log(`Alliance (trimmed): ${alliance}`);
      console.log(`Wave (raw): ${wave}`);
      console.log(`Wave (type): ${typeof wave}`);

      // Initialize nested objects safely
      offsets[guildId] = offsets[guildId] || {};
      offsets[guildId][alliance] = offsets[guildId][alliance] || {};

      // Create the non-Discord user key
      const key = `NONDISCORD:${personName}`;

      // Remove this person from other alliances in this guild
      for (const ally in offsets[guildId]) {
        // Skip the current alliance
        if (ally === alliance) continue;
        
        // Check each key in the alliance
        if (offsets[guildId][ally]) {
          for (const existingKey in offsets[guildId][ally]) {
            // If it's a NONDISCORD key and matches our person
            if (existingKey.startsWith('NONDISCORD:') && 
                existingKey.slice(10).toLowerCase() === personName.toLowerCase()) {
              delete offsets[guildId][ally][existingKey];
            }
          }
        }
      }

      // Store offset
      offsets[guildId][alliance][key] = neededSeconds;

      // Initialize user waves structure if it doesn't exist
      if (!offsets.userWaves) {
        console.log('Creating userWaves structure');
        offsets.userWaves = {};
      }
      if (!offsets.userWaves[guildId]) {
        console.log(`Creating userWaves for guild ${guildId}`);
        offsets.userWaves[guildId] = {};
      }
      if (!offsets.userWaves[guildId][alliance]) {
        console.log(`Creating userWaves for alliance ${alliance}`);
        offsets.userWaves[guildId][alliance] = {};
      }

      // Handle wave assignment
      if (wave !== null && wave !== undefined) {
        console.log(`Setting user ${key} to wave ${wave}`);
        // Set the user's wave
        offsets.userWaves[guildId][alliance][key] = wave;
        console.log(`After assignment: ${JSON.stringify(offsets.userWaves[guildId][alliance])}`);
      } else {
        console.log(`No wave specified for user ${key}, removing any existing wave assignment`);
        // Remove any existing wave assignment
        if (offsets.userWaves[guildId][alliance][key]) {
          delete offsets.userWaves[guildId][alliance][key];
        }
      }

      // Save to JSON
      await saveOffsets();
      
      // Verify the save worked
      console.log(`After save, userWaves for ${key}: ${JSON.stringify(offsets.userWaves[guildId][alliance][key])}`);
      console.log(`Full userWaves structure: ${JSON.stringify(offsets.userWaves)}`);

      // Prepare response message
      let responseMsg = `Set march time for **${personName}** in alliance **${alliance}** to **${neededSeconds} seconds**.`;
      
      // If the alliance was trimmed, add a note about it
      if (wasAllianceTrimmed) {
        responseMsg += `\n\n⚠️ Note: Your alliance input "${allianceInput}" was automatically trimmed to "${alliance}".`;
      }
      
      if (wave !== null && wave !== undefined) {
        responseMsg += ` Assigned to wave **${wave}**.`;
      } else {
        responseMsg += `\n\nTo assign them to a wave, use the wave parameter: \`/setother name:${personName} seconds:${neededSeconds} alliance:${alliance} wave:1\``;
      }

      await interaction.reply({
        content: responseMsg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in setother command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command. Make sure to use the correct format: `/setother name:PlayerName seconds:10 alliance:NWO wave:1`\n\n' +
                  '⚠️ **Important**: Discord slash commands require you to use the parameter names exactly as shown.\n' +
                  '✅ Correct: `/setother name:PlayerName seconds:10 alliance:NWO wave:1`\n' +
                  '❌ Incorrect: `/setother PlayerName 10 NWO wave:1`', 
          ephemeral: true 
        });
      }
    }
  },
};