const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settime')
    .setDescription('Set your march time to center and which alliance you are in.')
    .addIntegerOption(option =>
      option
        .setName('seconds')
        .setDescription('Your march time in seconds (e.g., 10 for 10 seconds)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('Your 3-letter alliance abbreviation (e.g., NWO)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Optional: Wave number for coordinated attacks (1, 2, 3, etc.)')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      // Log the raw interaction options for debugging
      console.log('Raw interaction options:');
      console.log(interaction.options._hoistedOptions);
      
      const userId = interaction.user.id;
      const guildId = interaction.guildId;
      const neededSeconds = interaction.options.getInteger('seconds');
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
      let wave = interaction.options.getInteger('wave');
      if (wave === null && extractedWave !== null) {
        wave = extractedWave;
        console.log(`Using wave ${wave} extracted from alliance input`);
      }
      
      // Debug logging
      console.log('settime command parameters:');
      console.log(`User ID: ${userId}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${allianceInput}`);
      console.log(`Alliance (trimmed): ${alliance}`);
      console.log(`Wave (raw): ${wave}`);
      console.log(`Wave (type): ${typeof wave}`);
      
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
        console.log(`Setting user ${userId} to wave ${wave}`);
        // Set the user's wave
        offsets.userWaves[guildId][alliance][userId] = wave;
        console.log(`After assignment: ${JSON.stringify(offsets.userWaves[guildId][alliance])}`);
      } else {
        console.log(`No wave specified for user ${userId}, removing any existing wave assignment`);
        // Remove any existing wave assignment
        if (offsets.userWaves[guildId][alliance][userId]) {
          delete offsets.userWaves[guildId][alliance][userId];
        }
      }

      // Save changes to JSON
      await saveOffsets();
      
      // Verify the save worked
      console.log(`After save, userWaves for ${userId}: ${JSON.stringify(offsets.userWaves[guildId][alliance][userId])}`);
      console.log(`Full userWaves structure: ${JSON.stringify(offsets.userWaves)}`);

      // Prepare response message
      let responseMsg = `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`;
      
      // If the alliance was trimmed, add a note about it
      if (wasAllianceTrimmed) {
        responseMsg += `\n\n⚠️ Note: Your alliance input "${allianceInput}" was automatically trimmed to "${alliance}".`;
      }
      
      if (wave !== null && wave !== undefined) {
        responseMsg += ` You are assigned to wave **${wave}**.`;
      } else {
        responseMsg += `\n\nTo assign yourself to a wave, use the wave parameter: \`/settime seconds:${neededSeconds} alliance:${alliance} wave:1\``;
      }

      await interaction.reply({
        content: responseMsg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error in settime command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command. Make sure to use the correct format: `/settime seconds:10 alliance:NWO wave:1`\n\n' +
                  '⚠️ **Important**: Discord slash commands require you to use the parameter names exactly as shown.\n' +
                  '✅ Correct: `/settime seconds:10 alliance:NWO wave:1`\n' +
                  '❌ Incorrect: `/settime 10 NWO wave:1`', 
          ephemeral: true 
        });
      }
    }
  },
};