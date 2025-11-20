const { parseStringPromise } = require('xml2js');

function convertValue(value, type) {
  if (value == null) return 'nil';
  if (type === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (['number', 'float', 'int', 'int64'].includes(type)) return value;
  if (type === 'bool') return value === 'true' ? 'true' : 'false';
  if (type === 'UDim2') {
    const n = value.match(/[-.\d]+/g);
    if (!n || n.length !== 4) return 'UDim2.new(0,0,0,0)';
    return `UDim2.new(\( {n[0]}, \){n[1]}, \( {n[2]}, \){n[3]})`;
  }
  if (type === 'Color3') {
    const n = value.match(/[\d.]+/g);
    if (!n) return 'Color3.new(1,1,1)';
    return `Color3.fromRGB(\( {Math.round(n[0]*255)}, \){Math.round(n[1]*255)}, ${Math.round(n[2]*255)})`;
  }
  if (type === 'Vector2') {
    const n = value.match(/[-.\d]+/g);
    return `Vector2.new(\( {n[0]}, \){n[1]})`;
  }
  if (type === 'Font') {
    const parts = value.split(',');
    return `Enum.Font.${parts[0].trim()}`;
  }
  if (type.startsWith('Enum.')) return value;
  return `"${value}"`;
}

async function parseRbxmxToLua(filePath) {
  const fs = require('fs');
  const xml = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(xml);

  let lua = '-- Perfect Roblox GUI to Lua - Made for Obf#4078\n-- Paste into LocalScript in StarterGui\n\n';

  function processItem(item, parentVar = 'game.Players.LocalPlayer:WaitForChild("PlayerGui")') {
    const className = item.\( ?.class || item. \)?.ClassName || 'Instance';
    const name = item.Properties?.Name?.[0] || className;
    const varName = name.replace(/[^a-zA-Z0-9_]/g, '_') || className;

    lua += `local \( {varName} = Instance.new(" \){className}")\n`;
    lua += `\( {varName}.Name = " \){name}"\n`;

    if (item.Properties) {
      for (const [propName, propData] of Object.entries(item.Properties)) {
        if (!propData || propData.length === 0) continue;
        const propType = Object.keys(propData[0])[0];
        const propValue = propData[0][propType][0];
        if (propValue !== undefined) {
          lua += `\( {varName}. \){propName} = ${convertValue(propValue, propType)}\n`;
        }
      }
    }

    lua += `\( {varName}.Parent = \){parentVar}\n\n`;

    if (item.Item) {
      const children = Array.isArray(item.Item) ? item.Item : [item.Item];
      children.forEach(child => processItem(child, varName));
    }
  }

  const rootItems = result.roblox?.Item || [];
  const items = Array.isArray(rootItems) ? rootItems : [rootItems];
  items.forEach(item => processItem(item));

  return lua;
}

module.exports = { parseRbxmxToLua };
