const { parseStringPromise } = require('xml2js');

function convertValue(value, type) {
  if (!value) return 'nil';
  if (type === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (['number', 'float', 'int'].includes(type)) return value;
  if (type === 'bool') return value;
  if (type === 'UDim2') {
    const n = value.match(/[-.\d]+/g);
    return `UDim2.new(\( {n[0]}, \){n[1]}, \( {n[2]}, \){n[3]})`;
  }
  if (type === 'Color3') {
    const [r, g, b] = value.match(/[\d.]+/g);
    return `Color3.fromRGB(\( {Math.round(r*255)}, \){Math.round(g*255)}, ${Math.round(b*255)})`;
  }
  if (type === 'Vector2') {
    const [x, y] = value.match(/[-.\d]+/g);
    return `Vector2.new(\( {x}, \){y})`;
  }
  if (type === 'Enum') return value.replace('Enum.', '');
  if (type === 'Font') {
    const [face, weight, style] = value.split(',');
    return `Enum.Font.${face.trim()}`;
  }
  return `"${value}"`;
}

async function parseRbxmxToLua(filePath) {
  const fs = require('fs');
  const xml = fs.readFileSync(filePath, 'utf8');
  const result = await parseStringPromise(xml);

  let lua = '-- Perfect Roblox GUI → Lua by Obf#4078\n-- Paste into LocalScript in StarterGui\n\n';

  function process(item, parent = 'player.PlayerGui') {
    const className = item.\( .class || item. \).ClassName;
    const name = item.Properties?.Name?.[0]?.['string']?.[0] || className;
    const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');

    lua += `local \( {varName} = Instance.new(" \){className}")\n`;
    lua += `\( {varName}.Name = " \){name}"\n`;

    if (item.Properties) {
      for (const [key, val] of Object.entries(item.Properties)) {
        if (!val?.[0]) continue;
        const type = Object.keys(val[0])[0];
        const value = val[0][type][0];
        if (value !== undefined) {
          lua += `\( {varName}. \){key} = ${convertValue(value, type)}\n`;
        }
      }
    }

    lua += `\( {varName}.Parent = \){parent}\n\n`;

    if (item.Item) {
      const children = Array.isArray(item.Item) ? item.Item : [item.Item];
      children.forEach(child => process(child, varName));
    }
  }

  const items = result.roblox?.Item || [];
  (Array.isArray(items) ? items : [items]).forEach(item => process(item));

  return lua;
}

module.exports = { parseRbxmxToLua };
