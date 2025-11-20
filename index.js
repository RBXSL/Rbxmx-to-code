require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
  }
});

// Merged ready handler: Log + register commands
client.once('ready', async () => {
  console.log(`${client.user.tag} is online and ready!`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Started refreshing application (/) commands...');
    const commandBody = client.commands.map(cmd => cmd.data.toJSON());

    if (commandBody.length === 0) {
      console.error('ERROR: No commands loaded! Check commands/convert.js exists and exports { data, execute }');
      return;
    }

    console.log(`Registering ${commandBody.length} command(s)...`);

    // Guild-specific (instant, replace with your server ID)
    const guildId = 'YOUR_TEST_GUILD_ID'; // e.g., '123456789012345678' — get from Discord Developer Mode
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commandBody });
    console.log(`✅ Guild commands registered to ${guildId}! (Instant sync)`);

    // Global (15-60 min delay)
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandBody });
    console.log('✅ Global commands registered! (May take 15-60 min to appear everywhere)');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);

// Dummy HTTP server to satisfy Render's port requirement
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Obf#4078 is alive and converting GUIs! 🚀');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dummy web server running on port ${PORT}`);
});
