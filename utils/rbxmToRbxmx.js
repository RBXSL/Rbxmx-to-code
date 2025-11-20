const { parseStringPromise } = require('xml2js');

function convertValue(value, type) {
  if (type === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (type === 'number' || type === 'int' || type === 'float') return value;
  if (type === 'bool') return value === 'true' ? 'true' : 'false';
  if (type === 'UDim2') {
    const matches = value.match(/\{([\d.-]+),\s*([\d.-]+)\},\s*\{([\d.-]+),\s*([\d.-]+)\}/);
    if (!matches) return 'UDim2.new(0,0,0,0)';
    return `UDim2.new(\( {matches[1]}, \){matches[2]}, \( {matches[3]}, \){matches[4]})`;
  }
  if (type === 'Color3') {
    const [r, g, b] = value.match(/[\d.]+/g).map(parseFloat);
    return `Color3.fromRGB(\( {Math.round(r * 255)}, \){Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
  if (type === 'Vector2') {
    const [x, y] = value.match(/[\d.-]+/g);
    return `Vector2.new(\( {x}, \){y})`;
  }
  if (type.includes('Enum')) return `Enum.\( {type.split('.').pop()}. \){value}`;
  return `"${value}"`;
}

async function parseRbxmxToLua(filePath) {
  const fs = require('fs');
  const xml = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(xml);

  let lua = '-- Converted by Obf#4078 - Roblox GUI to Lua\n\n';

  function processItem(item, parentVar = 'script.Parent') {
    const props = item.Properties?.[0] || {};
    const className = item.\( .ClassName || item. \).className || 'Instance';
    const name = item.$.Name || 'Instance';

    const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    lua += `local \( {varName} = Instance.new(" \){className}")\n`;
    lua += `\( {varName}.Name = " \){name}"\n`;

    for (const [key, valueObj] of Object.entries(props)) {
      if (!valueObj || valueObj.length === 0) continue;
      const type = Object.keys(valueObj[0])[0];
      const rawValue = valueObj[0][type][0];
      if (rawValue !== undefined) {
        lua += `\( {varName}. \){key} = ${convertValue(rawValue, type)}\n`;
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
