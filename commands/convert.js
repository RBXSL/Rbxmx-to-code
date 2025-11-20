const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parseRbxmxToLua } = require('../utils/rbxmxToLua');
const { convertRbxmToRbxmx } = require('../utils/rbxmToRbxmx');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert .rbxmx or .rbxm GUI to Roblox Lua code')
    .addAttachmentOption(option =>
      option
        .setName('file')
        .setDescription('.rbxmx or .rbxm file')
        .setRequired(true)
    ),

  async execute(interaction) {
    const file = interaction.options.getAttachment('file');
    if (!file.name.endsWith('.rbxmx') && !file.name.endsWith('.rbxm')) {
      return interaction.reply({ content: 'Only .rbxmx and .rbxm files!', ephemeral: true });
    }

    await interaction.deferReply();

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, file.name);

    try {
      // Critical: Discord now blocks downloads without proper headers
      const response = await axios.get(file.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'DiscordBot' }
      });
      fs.writeFileSync(filePath, response.data);

      let luaCode;
      if (file.name.endsWith('.rbxmx')) {
        luaCode = await parseRbxmxToLua(filePath);
      } else {
        const rbxmxPath = await convertRbxmToRbxmx(filePath);
        luaCode = await parseRbxmxToLua(rbxmxPath);
      }

      const luaFile = new AttachmentBuilder(Buffer.from(luaCode), { name: 'gui.lua' });

      await interaction.editReply({
        content: 'Here is your perfect Roblox Lua code!',
        files: [luaFile]
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `Error: ${error.message}` });
    } finally {
      // Cleanup
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const tempRbxmx = filePath.replace('.rbxm', '.rbxmx');
      if (fs.existsSync(tempRbxmx)) fs.unlinkSync(tempRbxmx);
    }
  }
};
