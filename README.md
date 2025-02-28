# Rally Bot for White Out Survival

Rally Bot is a Discord bot designed to help coordinate rally events by scheduling and managing target times (UTC) for alliances in your server. It supports commands for scheduling rallies, refreshing the current UTC time in real-time, clearing rally data, and providing an invite link with the minimal required permissions.

## Features

- **Schedule Rally**: Use the `/rally` command with a target UTC time (in HH:MM format) and alliance abbreviation. The bot calculates and displays the start times for members based on their offsets.
- **Real-time UTC Refresh**: The rally message includes the current UTC time and a refresh button (active for a specified duration) to update the time dynamically.
- **Clear Rally Data**: Use the `/clear` command to clear rally data for a specific alliance or the entire server. This feature includes a confirmation step with interactive buttons.
- **Set Rally Times**: Commands like `/settime` allow rally leaders to set their individual rally times (offsets are taken into consideration for rally coordination).
- **Invite Bot**: The `/invite` command returns an invite URL for the bot that includes the necessary scopes and permissions. The bot requires the following:
  - Scopes: `bot`, `applications.commands`
  - Permissions: View Channels, Send Messages, Add Reactions, Use External Emojis

## Available Commands

- `/settime seconds:<time> alliance:<alliance> [wave:<number>]`: Set your personal rally march time, which is used by the rally command to calculate start times. Optionally specify a wave number for coordinated attacks.

- `/setother name:<name> seconds:<time> alliance:<alliance> [wave:<number>]`: Set rally march time of non-discord user, which is used by the rally command to calculate start times. Optionally specify a wave number.

- `/rallywave alliance:<alliance> wave:<number> offset:<seconds>`: Configure wave offsets for coordinated multi-wave attacks.

- `/rally time:<time> alliance:<alliance> [waves:true|false]`: Schedule a rally event. Provide the UTC time in HH:MM format and the alliance abbreviation. The bot will display kick-off times with live UTC time and a refresh button for updating.

- `/rallyready time:<time> alliance:<alliance> [waves:true|false]`: Schedule rallies based on the first start time.

- `/clear [alliance:<alliance>]`: Clear rally data. Optionally provide an alliance abbreviation to clear data for that alliance only. Without the alliance option, all rally data for the server is cleared.

- `/debug`: Display current offsets data, wave configurations, and user wave assignments.

## Deployment

### Hosting on Render

This bot is configured for easy deployment on [Render](https://render.com/):

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render, connected to your forked repository
3. Set the following environment variables:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `CLIENT_ID`: Your Discord application client ID
4. Deploy the service

The bot is configured to automatically deploy Discord commands after each deployment through the `postinstall` script.

### Manual Deployment

If you're hosting the bot elsewhere:

1. Clone the repository
2. Create a `.env` file with your `DISCORD_TOKEN` and `CLIENT_ID` (see `.env.example`)
3. Run `npm install` to install dependencies
4. Run `npm run deploy` to register the Discord commands
5. Run `npm start` to start the bot

## Contributing

Feel free to fork the repository and open pull requests. If you encounter any issues or have suggestions for improvements, please open an issue in this repository.

Drop me a message in game Fred Eggs s2006 NWO

## License

This project is licensed for non-commercial use only. You may use, modify, and share this software for non-commercial purposes.

## Acknowledgments

- Built using [discord.js](https://discord.js.org/)
- Special thanks to the Discord Developer community for their support and documentation. 