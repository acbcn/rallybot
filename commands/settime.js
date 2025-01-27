// settime.js
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
    ),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId; // <--- KEY CHANGE #1
        const neededSeconds = interaction.options.getInteger('seconds');
        const alliance = interaction.options.getString('alliance').toUpperCase();
    
        // If this guild doesn't exist in offsets yet, create it
        if (!offsets[guildId]) {
          offsets[guildId] = {};
        }
    
        // Optional: remove user from old alliances in *this guild* only
        // (So each user can only belong to one alliance per guild)
        for (const ally in offsets[guildId]) {
          if (ally !== alliance && offsets[guildId][ally][userId]) {
            delete offsets[guildId][ally][userId];
          }
        }
    
        // If this alliance doesn't exist in this guild, create it
        if (!offsets[guildId][alliance]) {
          offsets[guildId][alliance] = {};
        }
    
        // Now set the user's offset
        offsets[guildId][alliance][userId] = neededSeconds;
    
        // Save changes to JSON
        saveOffsets();

    await interaction.reply(
      `You've been set to alliance **${alliance}** with a march time of **${neededSeconds}s**.`
    );
  },
};
