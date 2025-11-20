require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  console.log(`Loaded: ${command.data.name}`);
}

client.once('ready', async () => {
  console.log(`${client.user.tag} is online!`);

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const commands = client.commands.map(c => c.data.toJSON());

  try {
    // Replace 123456789 with your server ID for instant commands
    await rest.put(Routes.applicationGuildCommands(client.user.id, '123456789'), { body: commands });
    console.log('Guild commands registered (instant)');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Global commands registered');
  } catch (e) { console.error(e); }
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i); } catch (e) {
    console.error(e);
    await i.reply({ content: 'Error!', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);

// Keep Render alive
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot alive'));
app.listen(process.env.PORT || 3000);
