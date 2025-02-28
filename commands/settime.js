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
      const wave = interaction.options.getInteger('wave');

      // Debug logging
      console.log('settime command parameters:');
      console.log(`User ID: ${userId}`);
      console.log(`Guild ID: ${guildId}`);
      console.log(`Seconds: ${neededSeconds}`);
      console.log(`Alliance (raw): ${interaction.options.getString('alliance')}`);
      console.log(`Alliance (uppercase): ${alliance}`);
      console.log(`Wave: ${wave}`);

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

      // Handle wave assignment if provided
      if (wave !== null) {
        // Initialize user waves structure if it doesn't exist
        if (!offsets.userWaves) {
          offsets.userWaves = {};
        }
        if (!offsets.userWaves[guildId]) {
          offsets.userWaves[guildId] = {};
        }
        if (!offsets.userWaves[guildId][alliance]) {
          offsets.userWaves[guildId][alliance] = {};
        }

        // Set the user's wave
        offsets.userWaves[guildId][alliance][userId] = wave;
      }

      // Save changes to JSON
      saveOffsets();

      // Prepare response message
      let responseMsg = `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`;
      if (wave !== null) {
        responseMsg += ` You are assigned to wave **${wave}**.`;
      }

      await interaction.reply({
        content: responseMsg,
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