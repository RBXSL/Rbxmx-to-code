const { execFileSync } = require('child_process');
const path = require('path');

async function convertRbxmToRbxmx(rbxmPath) {
  const rbxmxPath = rbxmPath.replace(/\.rbxm$/i, '.rbxmx');
  const remodel = path.join(__dirname, '../bin/remodel');
  execFileSync(remodel, ['read', rbxmPath, '--output', rbxmxPath]);
  return rbxmxPath;
}

module.exports = { convertRbxmToRbxmx };
