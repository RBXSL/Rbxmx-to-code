require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

client.once('ready', () => {
  console.log(`${client.user.tag} is online and ready!`);
});

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

client.login(process.env.DISCORD_TOKEN);

// ──────────────────────────────
// 1. Fix Render port timeout (keeps service alive)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Obf#4078 is alive and converting GUIs! 🚀');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dummy web server running on port ${PORT}`);
});

// ──────────────────────────────
// 2. Register the /convert command globally (once when bot starts)
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`${client.user.tag} is online and ready!`);

  try {
    console.log('Started refreshing application (/) commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: client.commands.map(cmd => cmd.data.toJSON()) }
    );
    console.log('Successfully registered /convert command globally!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});
