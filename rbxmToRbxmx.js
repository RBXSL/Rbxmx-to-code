// utils/rbxmToRbxmx.js
// Fully automatic .rbxm → .rbxmx conversion using bundled remodel binary

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REMODEL_BIN = path.join(__dirname, '..', 'bin', 'remodel');

// Make sure the bin folder exists (you'll add the binary in a second)
if (!fs.existsSync(REMODEL_BIN)) {
  throw new Error('remodel binary not found! Download it from: https://github.com/rojo-rbx/remodel/releases/latest');
}

/**
 * Converts .rbxm to .rbxmx using the bundled remodel binary
 * @param {string} rbxmPath - Path to input .rbxm file
 * @returns {Promise<string>} Path to the generated .rbxmx file
 */
async function convertRbxmToRbxmx(rbxmPath) {
  const rbxmxPath = rbxmPath.replace(/\.rbxm$/i, '.rbxmx');

  try {
    // Run: remodel convert input.rbxm output.rbxmx
    execFileSync(REMODEL_BIN, ['convert', rbxmPath, rbxmxPath], { stdio: 'ignore' });
    console.log(`Converted \( {path.basename(rbxmPath)} → \){path.basename(rbxmxPath)}`);
    return rbxmxPath;
  } catch (err) {
    throw new Error(`remodel failed: ${err.message}`);
  }
}

module.exports = { convertRbxmToRbxmx };
