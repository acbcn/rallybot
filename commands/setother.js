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
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Optional: Wave number for coordinated attacks (1, 2, 3, etc.)')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      // Gather inputs
      const personName = interaction.options.getString('name');
      const neededSeconds = interaction.options.getInteger('seconds');
      const alliance = interaction.options.getString('alliance').toUpperCase();
      const guildId = interaction.guildId;
      let wave = interaction.options.getInteger('wave');

      // Debug logging
      console.log('setothername command parameters:');
      console.log(`Person Name: ${personName}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${interaction.options.getString('alliance')}`);
      console.log(`Alliance (uppercase): ${alliance}`);
      console.log(`Wave (raw): ${wave}`);

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
      } else {
        console.log(`No wave specified for user ${key}, removing any existing wave assignment`);
        // Remove any existing wave assignment
        if (offsets.userWaves[guildId][alliance][key]) {
          delete offsets.userWaves[guildId][alliance][key];
        }
      }

      // Save to JSON
      await saveOffsets();

      // Prepare response message
      let responseMsg = `Set march time for **${personName}** in alliance **${alliance}** to **${neededSeconds} seconds**.`;
      if (wave !== null && wave !== undefined) {
        responseMsg += ` Assigned to wave **${wave}**.`;
      }

      await interaction.reply({
        content: responseMsg,
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