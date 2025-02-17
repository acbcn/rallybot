const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { offsets, saveOffsets } = require('../offsets.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear rally data for this server')
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation to clear (leave empty to clear all alliances)')
        .setRequired(false)
    ),
  async execute(interaction) {
    // Defer the reply immediately to prevent timeout
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const guildId = interaction.guildId;
      const alliance = interaction.options.getString('alliance')?.toUpperCase();

      // Check if guild has any data
      if (!offsets[guildId]) {
        return await interaction.editReply({
          content: 'No data exists for this server.',
        });
      }

      // Create confirmation buttons
      const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Yes, Clear Data')
        .setStyle(ButtonStyle.Danger);

      const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder()
        .addComponents(cancel, confirm);

      // Prepare warning message
      let warningMsg = alliance 
        ? `⚠️ Are you sure you want to clear all data for alliance **${alliance}**?\nThis will delete all march times for this alliance.`
        : `⚠️ Are you sure you want to clear **ALL** rally data for this server?\nThis will delete all march times for all alliances.`;

      // Send confirmation message (private)
      const response = await interaction.editReply({
        content: warningMsg,
        components: [row],
      });

      try {
        // Wait for button interaction
        const confirmation = await response.awaitMessageComponent({ time: 30_000 });

        if (confirmation.customId === 'confirm') {
          if (alliance) {
            // Clear specific alliance
            if (!offsets[guildId][alliance]) {
              return await confirmation.update({
                content: `No data found for alliance **${alliance}** in this server.`,
                components: [],
              });
            }
            delete offsets[guildId][alliance];
            await saveOffsets();
            
            // Update private confirmation message
            await confirmation.update({
              content: `✅ You've cleared all data for alliance **${alliance}**.`,
              components: [],
            });
            
            // Send public announcement
            await interaction.followUp({
              content: `🗑️ <@${interaction.user.id}> has cleared all rally data for alliance **${alliance}**.`,
              ephemeral: false
            });
          } else {
            // Clear entire guild
            delete offsets[guildId];
            await saveOffsets();
            
            // Update private confirmation message
            await confirmation.update({
              content: `✅ You've cleared all rally data for this server.`,
              components: [],
            });
            
            // Send public announcement
            await interaction.followUp({
              content: `🗑️ <@${interaction.user.id}> has cleared **ALL** rally data for this server.`,
              ephemeral: false
            });
          }
        } else {
          await confirmation.update({
            content: 'Operation cancelled.',
            components: [],
          });
        }
      } catch (e) {
        // If no button was pressed in time
        await interaction.editReply({
          content: 'No response received within 30 seconds, operation cancelled.',
          components: [],
        });
      }
    } catch (error) {
      console.error('Error in clear command:', error);
      try {
        await interaction.editReply({
          content: 'There was an error processing your command.',
          components: [],
        });
      } catch (err) {
        console.error('Error sending error response:', err);
      }
    }
  },
}; 