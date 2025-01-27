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
    ),
  async execute(interaction) {
    // Gather inputs
    const personName = interaction.options.getString('name');
    const neededSeconds = interaction.options.getInteger('seconds');
    const alliance = interaction.options.getString('alliance').toUpperCase();
    // Get the current guild/server ID
    const guildId = interaction.guildId;

    // Ensure this guild is in the offsets data
    if (!offsets[guildId]) {
      offsets[guildId] = {};
    }
    // Ensure this alliance exists within this guild
    if (!offsets[guildId][alliance]) {
      offsets[guildId][alliance] = {};
    }

    // We'll store them under a "NONDISCORD" key so we know it's not a real Discord ID
    const key = `NONDISCORD:${personName}`;

    // Store offset in memory (for this guild + alliance)
    offsets[guildId][alliance][key] = neededSeconds;

    // Save to JSON, so the data persists
    saveOffsets();

    await interaction.reply(
      `Set march time for **${personName}** in alliance **${alliance}** to **${neededSeconds} seconds**.`
    );
  },
};
