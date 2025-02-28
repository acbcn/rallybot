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
      
      // Check if alliance contains "wave:" which indicates incorrect parameter usage
      if (allianceInput.toLowerCase().includes('wave:')) {
        return interaction.reply({
          content: '⚠️ **Error**: It looks like you\'re trying to include the wave in the alliance parameter.\n\n' +
                  'Discord slash commands require you to use the parameter names exactly as shown:\n' +
                  '✅ Correct: `/setother name:PlayerName seconds:10 alliance:NWO wave:1`\n' +
                  '❌ Incorrect: `/setother PlayerName 10 NWO wave:1`\n\n' +
                  'Please try again with the correct format.',
          ephemeral: true
        });
      }
      
      // Convert alliance to uppercase
      const alliance = allianceInput.toUpperCase();
      const wave = interaction.options.getInteger('wave');

      // Debug logging
      console.log('setother command parameters:');
      console.log(`Person Name: ${personName}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${allianceInput}`);
      console.log(`Alliance (uppercase): ${alliance}`);
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