// scripts/deploy-commands.js
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands globally.');

    // Register commands globally (takes about an hour to update):
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands globally. Changes will take effect within an hour.');
    
    // Fetch and log the registered commands to verify options
    console.log('Fetching registered commands to verify options...');
    const registeredCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );
    
    // Log each command and its options
    registeredCommands.forEach(cmd => {
      console.log(`\nCommand: ${cmd.name}`);
      if (cmd.options && cmd.options.length > 0) {
        console.log('Options:');
        cmd.options.forEach(opt => {
          console.log(`- ${opt.name} (${opt.type}) - Required: ${opt.required || false}`);
          // Log sub-options if any (for option type 1 = SUB_COMMAND)
          if (opt.options) {
            opt.options.forEach(subOpt => {
              console.log(`  - ${subOpt.name} (${subOpt.type}) - Required: ${subOpt.required || false}`);
            });
          }
        });
      } else {
        console.log('No options');
      }
    });
    
  } catch (error) {
    console.error(error);
  }
})();
