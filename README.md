# Rally Bot for White Out Survival

Rally Bot is a Discord bot designed to help coordinate rally events by scheduling and managing target times (UTC) for alliances in your server. It supports commands for scheduling rallies, refreshing the current UTC time in real-time, clearing rally data, and providing an invite link with the minimal required permissions.

## Features

- **Schedule Rally**: Use the `/rally` command with a target UTC time (in HH:MM format) and alliance abbreviation. The bot calculates and displays the start times for members based on their march times (offsets).
- **Real-time UTC Refresh**: The rally message includes the current UTC time and a refresh button (active for a specified duration) to update the time dynamically.
- **Clear Rally Data**: Use the `/clear` command to clear rally data for a specific alliance or the entire server. This feature includes a confirmation step with interactive buttons.
- **Set Rally Times**: Commands like `/settime` allow rally leaders to set their individual rally times (offsets are taken into consideration for rally coordination).
- **Invite Bot**: The `/invite` command returns an invite URL for the bot that includes the necessary scopes and permissions. The bot requires the following:
  - Scopes: `bot`, `applications.commands`
  - Permissions: View Channels, Send Messages, Add Reactions, Use External Emojis

. **Available Commands**:
   
   - `/settime <time> <alliance>` : Set your personal rally march time, which is used by the rally command to calculate start times.

   - `/setothername <time> <alliance>` : Set rally march time of non discord user, which is used by the rally command to calculate start times.

   - `/rally <time> <alliance>`: Schedule a rally event. Provide the UTC time in HH:MM format and the alliance abbreviation. The bot will display kick-off times with live UTC time and a refresh button for updating.
   
   - `/clear [alliance]`: Clear rally data. Optionally provide an alliance abbreviation to clear data for that alliance only. Without the alliance option, all rally data for the server is cleared.


## Contributing

Feel free to fork the repository and open pull requests. If you encounter any issues or have suggestions for improvements, please open an issue in this repository.

Drop me a message in game Fred Eggs s2006 NWO

## License

This project is licensed for non-commercial use only. You may use, modify, and share this software for non-commercial purposes. For any commercial use, please contact the author for a licensing agreement.

## Acknowledgments

- Built using [discord.js](https://discord.js.org/)
- Special thanks to the Discord Developer community for their support and documentation. 
