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
      const userId = interaction.user.id;
      const guildId = interaction.guildId;
      const neededSeconds = interaction.options.getInteger('seconds');
      const alliance = interaction.options.getString('alliance').toUpperCase();
      
      // Get wave parameter and ensure it's properly handled
      const wave = interaction.options.getInteger('wave');
      
      // Debug logging
      console.log('settime command parameters:');
      console.log(`User ID: ${userId}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${interaction.options.getString('alliance')}`);
      console.log(`Alliance (uppercase): ${alliance}`);
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

      // Prepare response message
      let responseMsg = `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`;
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
          content: 'There was an error processing your command. Make sure to use the correct format: `/settime seconds:10 alliance:NWO wave:1`', 
          ephemeral: true 
        });
      }
    }
  },
};