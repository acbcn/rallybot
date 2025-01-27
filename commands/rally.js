const { SlashCommandBuilder } = require('discord.js');
const { offsets } = require('../offsets.js'); // Import from your offsets file
// 5-minute rally stage in seconds
const RALLY_STAGE_TIME = 300; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rally')
    .setDescription('Schedule a center hit at a specific UTC time.')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('UTC time in HH:MM format (e.g., "01:32")')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alliance')
        .setDescription('3-letter alliance abbreviation.')
        .setRequired(true)
    ),
  async execute(interaction) {
    // 1) Get input
    const guildId = interaction.guildId; // <-- IMPORTANT: Identify this server
    const timeString = interaction.options.getString('time');
    const alliance = interaction.options.getString('alliance').toUpperCase();

    // 2) Validate time format
    if (!timeString.includes(':')) {
      return interaction.reply('Invalid time format. Use HH:MM, e.g., 01:32');
    }
    const [hourStr, minuteStr] = timeString.split(':');
    if (!hourStr || !minuteStr) {
      return interaction.reply('Invalid time format. Use HH:MM, e.g., 01:32');
    }
    const centerHour = parseInt(hourStr, 10);
    const centerMinute = parseInt(minuteStr, 10);
    if (isNaN(centerHour) || isNaN(centerMinute)) {
      return interaction.reply('Invalid numeric values for time. Use HH:MM, e.g., 01:32');
    }

    // 3) Convert to total seconds from midnight (UTC)
    let centerTimeInSeconds = centerHour * 3600 + centerMinute * 60;

    // 4) Check if this guild has data at all
    if (!offsets[guildId]) {
      return interaction.reply(`No data found for this server. Use /settime or /setothername first!`);
    }

    // 5) Check if the alliance exists in this guild
    if (!offsets[guildId][alliance]) {
      return interaction.reply(
        `No rally times found for alliance **${alliance}** in this server.`
      );
    }

    // 6) Pull the allianceOffsets (e.g., { userIdOrNONDISCORD: offsetSeconds, ... })
    const allianceOffsets = offsets[guildId][alliance];
    if (Object.keys(allianceOffsets).length === 0) {
      return interaction.reply(
        `No rally leaders have set their time for alliance **${alliance}** yet!`
      );
    }

    // 7) Build the reply header
    let response = `**Rally for Alliance ${alliance}**\n`;
    response += `Hit Center at **${timeString} UTC**\n\n`;
    response += `**Start Times:**\n`;

    // 8) Calculate each leader's start time
    for (const key of Object.keys(allianceOffsets)) {
      const userOffset = allianceOffsets[key]; // offset in seconds
      let startTimeInSeconds = centerTimeInSeconds - (RALLY_STAGE_TIME + userOffset);

      // Wrap around if negative (before 00:00)
      if (startTimeInSeconds < 0) {
        startTimeInSeconds += 24 * 3600;
      }
      // Wrap around if >= 24:00
      if (startTimeInSeconds >= 24 * 3600) {
        startTimeInSeconds -= 24 * 3600;
      }

      // Convert to HH:MM:SS
      const startHour = Math.floor(startTimeInSeconds / 3600);
      const remainder = startTimeInSeconds % 3600;
      const startMinute = Math.floor(remainder / 60);
      const startSecond = remainder % 60;

      // Format
      const hh = String(startHour).padStart(2, '0');
      const mm = String(startMinute).padStart(2, '0');
      const ss = String(startSecond).padStart(2, '0');

      // Check if it's a non-Discord user or a Discord user ID
      let displayName;
      if (key.startsWith('NONDISCORD:')) {
        displayName = key.replace('NONDISCORD:', '');
      } else {
        displayName = `<@${key}>`;
      }

      response += `${displayName}: **${hh}:${mm}:${ss} UTC** (needs ${userOffset}s)\n`;
    }

    // 9) Send the final message
    await interaction.reply(response);
  },
};
