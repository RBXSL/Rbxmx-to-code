const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseRbxmxToLua } = require('../utils/rbxmxToLua');
const { convertRbxmToRbxmx } = require('../utils/rbxmToRbxmx');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert .rbxmx or .rbxm GUI to Roblox Lua code')
    .addAttachmentOption(option =>
      option.setName('file').setDescription('.rbxmx or .rbxm file').setRequired(true)
    ),

  async execute(interaction) {
    const attachment = interaction.options.getAttachment('file');
    const fileExt = path.extname(attachment.name).toLowerCase();

    if (!['.rbxmx', '.rbxm'].includes(fileExt)) {
      return interaction.reply({ content: 'Only .rbxmx and .rbxm files are supported!', ephemeral: true });
    }

    await interaction.deferReply();

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, attachment.name);

    try {
      // THIS IS THE CRITICAL FIX — proper axios download with headers
      const response = await axios.get(attachment.url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'DiscordBot (https://github.com/RBXSL/Rbxmx-to-code)'
        }
      });

      fs.writeFileSync(filePath, response.data);

      let luaCode;
      if (fileExt === '.rbxmx') {
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
      // Clean up
      [filePath, filePath.replace('.rbxm', '.rbxmx')].forEach(f => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
    }
  },
};
