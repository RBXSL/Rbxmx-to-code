const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parseRbxmxToLua } = require('../utils/rbxmxToLua');
const { convertRbxmToRbxmx } = require('../utils/rbxmToRbxmx');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert .rbxmx/.rbxm to Lua')
    .addAttachmentOption(o => o.setName('file').setDescription('GUI file').setRequired(true)),

  async execute(interaction) {
    const file = interaction.options.getAttachment('file');
    if (!file.name.match(/\.(rbxm|rbxmx)$/i)) {
      return interaction.reply({ content: 'Only .rbxmx/.rbxm!', ephemeral: true });
    }

    await interaction.deferReply();
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, file.name);

    try {
      const res = await axios.get(file.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'DiscordBot' }
      });
      fs.writeFileSync(filePath, res.data);

      let lua;
      if (file.name.endsWith('.rbxmx')) {
        lua = await parseRbxmxToLua(filePath);
      } else {
        const rbxmxPath = await convertRbxmToRbxmx(filePath);
        lua = await parseRbxmxToLua(rbxmxPath);
      }

      const attachment = new AttachmentBuilder(Buffer.from(lua), { name: 'gui.lua' });
      await interaction.editReply({ content: 'Perfect Lua code!', files: [attachment] });

    } catch (e) {
      console.error(e);
      await interaction.editReply({ content: `Error: ${e.message}` });
    } finally {
      [filePath, filePath.replace('.rbxm', '.rbxmx')].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    }
  }
};
