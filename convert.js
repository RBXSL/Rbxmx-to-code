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
  console.log(`Loaded command: ${command.data.name}`); // ← Debug line
}

// Interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Error executing command!', ephemeral: true });
  }
});

// ONE AND ONLY ready handler — logs + registers commands
client.once('ready', async () => {
  console.log(`${client.user.tag} is online and ready!`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    const commandsToRegister = client.commands.map(cmd => cmd.data.toJSON());

    if (commandsToRegister.length === 0) {
      console.error('NO COMMANDS LOADED! Check commands folder.');
      return;
    }

    console.log(`Registering ${commandsToRegister.length} command(s):`, commandsToRegister.map(c => c.name));

    // REPLACE THIS WITH YOUR SERVER ID
    const TEST_GUILD_ID = 'YOUR_SERVER_ID_HERE';

    // Instant guild commands (appears in <10 seconds)
    await rest.put(Routes.applicationGuildCommands(client.user.id, TEST_GUILD_ID), {
      body: commandsToRegister
    });
    console.log(`Guild commands registered instantly in ${TEST_GUILD_ID}`);

    // Global commands (can take up to 1 hour)
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commandsToRegister
    });
    console.log('Global commands registered (may take time to appear)');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);

// Keep Render alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Obf#4078 is alive!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Web server on port ${PORT}`));
