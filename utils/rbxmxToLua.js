const { parseStringPromise } = require('xml2js');

function convertValue(value, type) {
  if (type === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (type === 'number' || type === 'int' || type === 'float') return value;
  if (type === 'bool') return value === 'true' ? 'true' : 'false';
  if (type === 'UDim2') {
    const [a, b, c, d] = value.match(/{[\d.-]+,\s*[\d.-]+},\s*{[\d.-]+,\s*[\d.-]+}/)[0].slice(1, -1).split(/},\s*{|,/).map(parseFloat);
    return `UDim2.new(\( {a}, \){b}, \( {c}, \){d})`;
  }
  if (type === 'Color3') {
    const [r, g, b] = value.match(/[\d.]+/g).map(parseFloat);
    return `Color3.fromRGB(\( {Math.round(r*255)}, \){Math.round(g*255)}, ${Math.round(b*255)})`;
  }
  if (type === 'Vector2') return `Vector2.new(${value.match(/[\d.-]+/g).join(', ')})`;
  if (type === 'Enum') return `Enum.${value.split('.').pop()}`;
  return `"${value}"`;
}

async function parseRbxmxToLua(filePath) {
  const fs = require('fs');
  const xml = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(xml);

  let lua = '-- Converted by Obf#4078\n';

  function processItem(item, parentVar = 'script.Parent') {
    const className = item.\( .ClassName || item. \).className;
    const name = item.$.Name || 'Instance';

    const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    lua += `local \( {varName} = Instance.new(" \){className}")\n`;
    lua += `\( {varName}.Name = " \){name}"\n`;
    if (parentVar) lua += `\( {varName}.Parent = \){parentVar}\n\n`;

    if (item.Properties) {
      for (const [key, prop] of Object.entries(item.Properties)) {
        if (!prop || !prop[0]) continue;
        const type = Object.keys(prop[0])[0];
        const value = prop[0][type][0];
        if (type && value !== undefined) {
          lua += `\( {varName}. \){key} = ${convertValue(value, type)}\n`;
        }
      }
    }

    if (item.Item) {
      (Array.isArray(item.Item) ? item.Item : [item.Item]).forEach(child => processItem(child, varName));
    }
  }

  const root = result.roblox?.Item || result.roblox?.roblox?.Item;
  if (root) (Array.isArray(root) ? root : [root]).forEach(item => processItem(item));

  return lua;
}

module.exports = { parseRbxmxToLua };
