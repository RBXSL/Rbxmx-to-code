const { execFileSync } = require('child_process');
const path = require('path');

async function convertRbxmToRbxmx(rbxmPath) {
  const rbxmxPath = rbxmPath.replace(/\.rbxm$/i, '.rbxmx');
  const remodelPath = path.join(__dirname, '../bin/remodel');

  try {
    execFileSync(remodelPath, ['read', rbxmPath, '--output', rbxmxPath]);
    return rbxmxPath;
  } catch (err) {
    throw new Error('.rbxm not supported yet — upload .rbxmx files or add bin/remodel');
  }
}

module.exports = { convertRbxmToRbxmx };
