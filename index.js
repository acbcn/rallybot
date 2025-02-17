require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please make sure these are set in your .env file');
  process.exit(1);
}

const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = 'There was an error executing that command!';
    
    try {
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, flags: 64 });
      }
    } catch (err) {
      console.error('Error sending error response:', err);
    }
  }
});

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Login
client.login(process.env.DISCORD_TOKEN);

