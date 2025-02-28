const { SlashCommandBuilder } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assignwave')
    .setDescription('Assign a player to a specific wave')
    .addStringOption(option =>
      option
        .setName('player')
        .setDescription('Discord @mention or name of non-Discord player')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation (e.g., NWO)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('wave')
        .setDescription('Wave number to assign (e.g., 1 for Wave 1)')
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      // Get inputs
      const guildId = interaction.guildId;
      const playerInput = interaction.options.getString('player');
      let allianceInput = interaction.options.getString('alliance');
      const waveNumber = interaction.options.getInteger('wave');
      
      // Extract only the first 3 characters for alliance code
      let alliance = '';
      let wasAllianceTrimmed = false;
      
      if (allianceInput && allianceInput.length > 0) {
        // Take up to the first 3 characters and convert to uppercase
        alliance = allianceInput.substring(0, 3).toUpperCase();
        
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
      
      // Validate wave number
      if (waveNumber < 1) {
        return interaction.reply({
          content: 'Wave number must be 1 or greater.',
          ephemeral: true
        });
      }
      
      // Check if wave exists for this alliance
      if (!offsets.waves?.[guildId]?.[alliance]?.[waveNumber]) {
        return interaction.reply({
          content: `⚠️ Wave ${waveNumber} is not configured for alliance **${alliance}**.\n\n` +
                  `Please set up the wave first using:\n` +
                  `\`/rallywave alliance:${alliance} wave:${waveNumber} offset:0\``,
          ephemeral: true
        });
      }
      
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
      
      // Determine if this is a Discord user or a non-Discord player
      let userId;
      let displayName;
      let isDiscordUser = false;
      
      // Check if input is a Discord mention
      const mentionMatch = playerInput.match(/<@!?(\d+)>/);
      if (mentionMatch) {
        // This is a Discord user mention
        userId = mentionMatch[1];
        isDiscordUser = true;
        
        try {
          // Try to fetch the user to verify they exist
          const user = await interaction.client.users.fetch(userId);
          displayName = user.username;
        } catch (error) {
          console.error(`Failed to fetch user with ID ${userId}:`, error);
          return interaction.reply({
            content: '⚠️ Could not find a Discord user with that mention. Please check the mention and try again.',
            ephemeral: true
          });
        }
      } else {
        // This is a non-Discord player name
        displayName = playerInput.trim();
        userId = `NONDISCORD:${displayName}`;
      }
      
      // Check if the player has a march time set for this alliance
      if (isDiscordUser) {
        if (!offsets[guildId]?.[alliance]?.[userId]) {
          return interaction.reply({
            content: `⚠️ <@${userId}> does not have a march time set for alliance **${alliance}**.\n\n` +
                    `They need to set their march time first using:\n` +
                    `\`/settime seconds:10 alliance:${alliance}\``,
            ephemeral: true
          });
        }
      } else {
        if (!offsets[guildId]?.[alliance]?.[userId]) {
          return interaction.reply({
            content: `⚠️ **${displayName}** does not have a march time set for alliance **${alliance}**.\n\n` +
                    `Set their march time first using:\n` +
                    `\`/setother name:${displayName} seconds:10 alliance:${alliance}\``,
            ephemeral: true
          });
        }
      }
      
      // Assign the player to the wave
      offsets.userWaves[guildId][alliance][userId] = waveNumber;
      
      // Save changes
      await saveOffsets();
      
      // Prepare response message
      let responseMsg;
      if (isDiscordUser) {
        responseMsg = `✅ <@${userId}> has been assigned to wave **${waveNumber}** for alliance **${alliance}**.`;
      } else {
        responseMsg = `✅ **${displayName}** has been assigned to wave **${waveNumber}** for alliance **${alliance}**.`;
      }
      
      // If the alliance was trimmed, add a note about it
      if (wasAllianceTrimmed) {
        responseMsg += `\n\n⚠️ Note: Your alliance input "${allianceInput}" was automatically trimmed to "${alliance}".`;
      }
      
      await interaction.reply({
        content: responseMsg,
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error in assignwave command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error processing your command. Make sure to use the correct format:\n\n' +
                  '⚠️ **Important**: Discord slash commands require you to use the parameter names exactly as shown.\n' +
                  '✅ Correct: `/assignwave player:@Username alliance:NWO wave:1`\n' +
                  '✅ Or for non-Discord players: `/assignwave player:PlayerName alliance:NWO wave:1`', 
          ephemeral: true 
        });
      }
    }
  },
}; 