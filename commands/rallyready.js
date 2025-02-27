const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { offsets } = require('../offsets.js'); // Import from your offsets file
// 5-minute rally stage in seconds
const RALLY_STAGE_TIME = 300; 
// 15 minutes in milliseconds
const REFRESH_BUTTON_DURATION = 900000;

// Shared scheduledDMs Map from rally.js
const scheduledDMs = new Map();

// Helper function to clear existing scheduled DMs for an alliance
function clearScheduledDMsForAlliance(alliance) {
  for (const [key, timeoutId] of scheduledDMs.entries()) {
    if (key.includes(`-${alliance}-`)) {
      clearTimeout(timeoutId);
      scheduledDMs.delete(key);
    }
  }
}

// Helper function to format time
function formatTime(hours, minutes, seconds = 0) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update the scheduleRallyDM function
async function scheduleRallyDM(interaction, userId, alliance, startTime, delayInSeconds) {
  // Create a unique key for this rally notification
  const notificationKey = `${userId}-${alliance}-${startTime}`;
  
  // If we already scheduled this notification, clear it first
  if (scheduledDMs.has(notificationKey)) {
    clearTimeout(scheduledDMs.get(notificationKey));
    scheduledDMs.delete(notificationKey);
  }

  const timeoutId = setTimeout(async () => {
    try {
      const user = await interaction.client.users.fetch(userId);
      await user.send(`🚀 **RALLY LAUNCH ALERT!**\nTime to launch your rally for alliance **${alliance}**!\nYour start time is: **${startTime} UTC**`);
    } catch (error) {
      console.error(`Failed to send DM to user ${userId}:`, error);
    } finally {
      // Clean up after sending
      scheduledDMs.delete(notificationKey);
    }
  }, delayInSeconds * 1000);

  // Store the timeout ID so we can clear it if needed
  scheduledDMs.set(notificationKey, timeoutId);
}

// Helper function to generate the rallyready message
function generateRallyReadyMessage(alliance, firstStartTime, allianceOffsets, firstStartTimeInSeconds) {
  const now = new Date();
  const currentUTC = formatTime(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

  // Find the minimum offset to determine who starts first
  let minOffset = Number.MAX_SAFE_INTEGER;
  for (const offset of Object.values(allianceOffsets)) {
    if (offset < minOffset) {
      minOffset = offset;
    }
  }

  // Calculate center hit time based on first start time and minimum offset
  let centerTimeInSeconds = firstStartTimeInSeconds + RALLY_STAGE_TIME + minOffset;
  
  // Handle day boundaries
  if (centerTimeInSeconds >= 24 * 3600) {
    centerTimeInSeconds -= 24 * 3600;
  }
  
  const centerHour = Math.floor(centerTimeInSeconds / 3600);
  const centerRemainder = centerTimeInSeconds % 3600;
  const centerMinute = Math.floor(centerRemainder / 60);
  const centerSecond = centerRemainder % 60;
  const centerTime = formatTime(centerHour, centerMinute, centerSecond);

  let response = `**Rally Ready for Alliance ${alliance}**\n`;
  response += `🎯 Hit Center at **${centerTime} UTC**\n`;
  response += `🕒 Current UTC Time: **${currentUTC}**\n\n`;
  response += `**Start Times:**\n`;

  for (const key of Object.keys(allianceOffsets)) {
    const userOffset = allianceOffsets[key];
    
    // Calculate this user's start time based on the center time
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
    .setName('rallyready')
    .setDescription('Schedule rallies based on the first start time.')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('UTC time in HH:MM:SS format for first rally start (e.g., "01:32:00")')
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
      return interaction.reply('Invalid time format. Use HH:MM:SS, e.g., 01:32:00');
    }
    
    const timeParts = timeString.split(':');
    if (timeParts.length < 2 || timeParts.length > 3) {
      return interaction.reply('Invalid time format. Use HH:MM:SS, e.g., 01:32:00');
    }
    
    const hourStr = timeParts[0];
    const minuteStr = timeParts[1];
    const secondStr = timeParts.length === 3 ? timeParts[2] : '00';
    
    if (!hourStr || !minuteStr) {
      return interaction.reply('Invalid time format. Use HH:MM:SS, e.g., 01:32:00');
    }
    
    const startHour = parseInt(hourStr, 10);
    const startMinute = parseInt(minuteStr, 10);
    const startSecond = parseInt(secondStr, 10);
    
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(startSecond)) {
      return interaction.reply('Invalid numeric values for time. Use HH:MM:SS, e.g., 01:32:00');
    }

    // 3) Convert to total seconds from midnight (UTC)
    let firstStartTimeInSeconds = startHour * 3600 + startMinute * 60 + startSecond;

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

    // Find the minimum offset to determine who starts first
    let minOffset = Number.MAX_SAFE_INTEGER;
    for (const offset of Object.values(allianceOffsets)) {
      if (offset < minOffset) {
        minOffset = offset;
      }
    }

    // Calculate center hit time based on first start time and minimum offset
    let centerTimeInSeconds = firstStartTimeInSeconds + RALLY_STAGE_TIME + minOffset;
    
    // Handle day boundaries
    if (centerTimeInSeconds >= 24 * 3600) {
      centerTimeInSeconds -= 24 * 3600;
    }

    // Clear any existing scheduled DMs for this alliance
    clearScheduledDMsForAlliance(alliance);

    // Schedule DMs for users who want notifications
    if (offsets.wantsDM?.[guildId]) {
      console.log('Found wantsDM for guild:', guildId);
      const now = new Date();
      const currentUTCHours = now.getUTCHours();
      const currentUTCMinutes = now.getUTCMinutes();
      const currentUTCSeconds = now.getUTCSeconds();
      const currentTimeInSeconds = (currentUTCHours * 3600) + (currentUTCMinutes * 60) + currentUTCSeconds;

      // For each user in the alliance that wants DMs
      for (const [userId, offset] of Object.entries(allianceOffsets)) {
        console.log('Checking user:', userId, 'wantsDM:', offsets.wantsDM[guildId][userId]);
        if (!offsets.wantsDM[guildId][userId]) continue;

        // Calculate this user's start time based on the center time
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

          console.log('Scheduling DM for user:', userId, 'at time:', startTime, 'with delay:', delayInSeconds);
          await scheduleRallyDM(interaction, userId, alliance, startTime, delayInSeconds);
        } else {
          console.log('Not scheduling DM - invalid delay:', delayInSeconds);
        }
      }
    } else {
      console.log('No users want DMs in guild:', guildId);
    }

    // Create refresh button
    const refresh = new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel('🔄 Refresh UTC Time')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(refresh);

    // Generate initial message
    const response = generateRallyReadyMessage(alliance, timeString, allianceOffsets, firstStartTimeInSeconds);

    // Send message with refresh button
    await interaction.reply({
      content: response,
      components: [row],
    });

    // Get the replied message
    const message = await interaction.fetchReply();

    // Create button collector
    const collector = message.createMessageComponentCollector({ time: REFRESH_BUTTON_DURATION });

    collector.on('collect', async i => {
      if (i.customId === 'refresh') {
        // Use the original first start time to maintain relative time calculations
        const updatedResponse = generateRallyReadyMessage(alliance, timeString, allianceOffsets, firstStartTimeInSeconds);
        await i.update({
          content: updatedResponse,
          components: [row]
        });
      }
    });

    collector.on('end', async () => {
      // Remove button after time expires
      const finalResponse = generateRallyReadyMessage(alliance, timeString, allianceOffsets, firstStartTimeInSeconds);
      await message.edit({
        content: finalResponse,
        components: []
      }).catch(console.error);
    });
  },
}; 