const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { offsets } = require('../offsets.js'); // Import from your offsets file
// 5-minute rally stage in seconds
const RALLY_STAGE_TIME = 300; 
// 15 minutes in milliseconds
const REFRESH_BUTTON_DURATION = 900000;

// Helper function to format time
function formatTime(hours, minutes, seconds = 0) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Add this function after the formatTime function
async function scheduleRallyDM(interaction, userId, alliance, startTime, delayInSeconds) {
  setTimeout(async () => {
    try {
      const user = await interaction.client.users.fetch(userId);
      await user.send(`🚀 **RALLY LAUNCH ALERT!**\nTime to launch your rally for alliance **${alliance}**!\nYour start time is: **${startTime} UTC**`);
    } catch (error) {
      console.error(`Failed to send DM to user ${userId}:`, error);
    }
  }, delayInSeconds * 1000);
}

// Helper function to generate the rally message
function generateRallyMessage(alliance, targetTime, allianceOffsets, centerTimeInSeconds) {
  const now = new Date();
  const currentUTC = formatTime(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

  let response = `**Rally for Alliance ${alliance}**\n`;
  response += `🎯 Hit Center at **${targetTime}:00 UTC**\n`;
  response += `🕒 Current UTC Time: **${currentUTC}**\n\n`;
  response += `**Start Times:**\n`;

  for (const key of Object.keys(allianceOffsets)) {
    const userOffset = allianceOffsets[key];
    let startTimeInSeconds = centerTimeInSeconds - (RALLY_STAGE_TIME + userOffset);

    if (startTimeInSeconds < 0) {
      startTimeInSeconds += 24 * 3600;
    }
    if (startTimeInSeconds >= 24 * 3600) {
      startTimeInSeconds -= 24 * 3600;
    }

    const startHour = Math.floor(startTimeInSeconds / 3600);
    const remainder = startTimeInSeconds % 3600;
    const startMinute = Math.floor(remainder / 60);
    const startSecond = remainder % 60;
    const startTime = formatTime(startHour, startMinute, startSecond);

    let displayName;
    if (key.startsWith('NONDISCORD:')) {
      displayName = key.replace('NONDISCORD:', '');
    } else {
      displayName = `<@${key}>`;
    }

    response += `${displayName}: **${startTime} UTC** (needs ${userOffset}s)\n`;
  }

  return response;
}

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
    const guildId = interaction.guildId;
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

    // 6) Pull the allianceOffsets
    const allianceOffsets = offsets[guildId][alliance];
    if (Object.keys(allianceOffsets).length === 0) {
      return interaction.reply(
        `No rally leaders have set their time for alliance **${alliance}** yet!`
      );
    }

    // Schedule DMs for users who want notifications
    if (offsets.wantsDM?.[guildId]) {
      const now = new Date();
      const currentUTCHours = now.getUTCHours();
      const currentUTCMinutes = now.getUTCMinutes();
      const currentUTCSeconds = now.getUTCSeconds();
      const currentTimeInSeconds = (currentUTCHours * 3600) + (currentUTCMinutes * 60) + currentUTCSeconds;

      // For each user in the alliance that wants DMs
      for (const [userId, offset] of Object.entries(allianceOffsets)) {
        if (!offsets.wantsDM[guildId][userId]) continue;

        let userStartTimeInSeconds = centerTimeInSeconds - (RALLY_STAGE_TIME + offset);
        
        if (userStartTimeInSeconds < 0) {
          userStartTimeInSeconds += 24 * 3600;
        }
        if (userStartTimeInSeconds >= 24 * 3600) {
          userStartTimeInSeconds -= 24 * 3600;
        }

        let delayInSeconds;
        if (userStartTimeInSeconds > currentTimeInSeconds) {
          delayInSeconds = userStartTimeInSeconds - currentTimeInSeconds;
        } else {
          delayInSeconds = (24 * 3600 - currentTimeInSeconds) + userStartTimeInSeconds;
        }

        // Subtract 2 seconds for the early notification
        delayInSeconds -= 2;

        // Only schedule if the time hasn't passed and is within 6 hours
        if (delayInSeconds > 0 && delayInSeconds <= 21600) {
          const startHour = Math.floor(userStartTimeInSeconds / 3600);
          const remainder = userStartTimeInSeconds % 3600;
          const startMinute = Math.floor(remainder / 60);
          const startSecond = remainder % 60;
          const startTime = formatTime(startHour, startMinute, startSecond);

          await scheduleRallyDM(interaction, userId, alliance, startTime, delayInSeconds);
        }
      }
    }

    // Create refresh button
    const refresh = new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel('🔄 Refresh UTC Time')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(refresh);

    // Generate initial message
    const response = generateRallyMessage(alliance, timeString, allianceOffsets, centerTimeInSeconds);

    // Send message with refresh button
    const message = await interaction.reply({
      content: response,
      components: [row],
      fetchReply: true
    });

    // Create button collector
    const collector = message.createMessageComponentCollector({ time: REFRESH_BUTTON_DURATION });

    collector.on('collect', async i => {
      if (i.customId === 'refresh') {
        // Generate new message with updated time
        const updatedResponse = generateRallyMessage(alliance, timeString, allianceOffsets, centerTimeInSeconds);
        await i.update({
          content: updatedResponse,
          components: [row]
        });
      }
    });

    collector.on('end', async () => {
      // Remove button after time expires
      const finalResponse = generateRallyMessage(alliance, timeString, allianceOffsets, centerTimeInSeconds);
      await message.edit({
        content: finalResponse,
        components: []
      }).catch(console.error);
    });
  },
};
