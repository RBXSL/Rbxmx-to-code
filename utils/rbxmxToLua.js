const { parseStringPromise } = require('xml2js');

function convertValue(value, type) {
  if (type === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (['number', 'int', 'float'].includes(type)) return value;
  if (type === 'bool') return value === 'true' ? 'true' : 'false';
  if (type === 'UDim2') {
    const nums = value.match(/[-.\d]+/g);
    if (!nums) return 'UDim2.new(0,0,0,0)';
    return `UDim2.new(\( {nums[0]}, \){nums[1]}, \( {nums[2]}, \){nums[3]})`;
  }
  if (type === 'Color3') {
    const [r, g, b] = value.match(/[\d.]+/g).map(parseFloat);
    return `Color3.fromRGB(\( {Math.round(r*255)}, \){Math.round(g*255)}, ${Math.round(b*255)})`;
  }
  if (type === 'Vector2') {
    const [x, y] = value.match(/[-.\d]+/g);
    return `Vector2.new(\( {x}, \){y})`;
  }
  if (type.includes('Enum')) return `Enum.\( {type.split('.').pop()}. \){value}`;
  return `"${value}"`;
}

async function parseRbxmxToLua(filePath) {
  const fs = require('fs');
  const xml = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(xml);

  let lua = '-- Converted by Obf#4078 - Perfect Roblox GUI to Lua\n\n';

  function processItem(item, parentVar = 'game.Players.LocalPlayer.PlayerGui') {
    const className = item.$?.ClassName || 'Instance';
    const name = item.$?.Name || 'Instance';
    const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');

    lua += `local \( {varName} = Instance.new(" \){className}")\n`;
    lua += `\( {varName}.Name = " \){name}"\n`;

    if (item.Properties) {
      for (const [propName, propArray] of Object.entries(item.Properties)) {
        if (!propArray || propArray.length === 0) continue;
        const propType = Object.keys(propArray[0])[0];
        const propValue = propArray[0][propType][0];
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

  const items = result.roblox?.Item || [];
  (Array.isArray(items) ? items : [items]).forEach(item => processItem(item));

  return lua;
}

module.exports = { parseRbxmxToLua };
