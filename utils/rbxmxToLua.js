const { execFileSync } = require('child_process');
const path = require('path');

async function convertRbxmToRbxmx(rbxmPath) {
  const rbxmxPath = rbxmPath.replace(/\.rbxm$/i, '.rbxmx');
  const remodelPath = path.join(__dirname, '../bin/remodel');

  try {
    execFileSync(remodelPath, ['read', rbxmPath, '--output', rbxmxPath]);
    return rbxmxPath;
  } catch (err) {
    throw new Error('Failed to convert .rbxm — make sure bin/remodel is uploaded (or try .rbxmx files only)');
  }
}

module.exports = { convertRbxmToRbxmx };
