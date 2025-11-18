from lxml import etree

# Property types Roblox uses
STRING_TYPES = ["string", "Content", "ProtectedString"]
COLOR3_TYPES = ["Color3"]
UDIM2_TYPES = ["UDim2"]
BOOLEAN_TYPES = ["bool"]
NUMBER_TYPES = ["float", "int"]
VECTOR2_TYPES = ["Vector2"]
ENUM_TYPES = ["token"]

def format_property(name, ptype, value):
    if ptype in STRING_TYPES:
        return f'{name} = "{value}"'

    if ptype in BOOLEAN_TYPES:
        return f'{name} = {value.lower()}'

    if ptype in NUMBER_TYPES:
        return f'{name} = {value}'

    if ptype in COLOR3_TYPES:
        r, g, b = map(float, value.split(","))
        return f'{name} = Color3.fromRGB({int(r*255)}, {int(g*255)}, {int(b*255)})'

    if ptype in UDIM2_TYPES:
        sx, ox, sy, oy = map(float, value.split(","))
        return f'{name} = UDim2.new({sx}, {int(ox)}, {sy}, {int(oy)})'

    if ptype in VECTOR2_TYPES:
        x, y = map(float, value.split(","))
        return f'{name} = Vector2.new({x}, {y})'

    if ptype in ENUM_TYPES:
        return f'{name} = Enum.{value.replace(".", ".Enum.")}'

    return None


def convert_instance(node, depth=0):
    indent = "    " * depth
    class_name = node.get("class")
    name = node.get("name")

    code = f'{indent}local {name} = Instance.new("{class_name}")\n'

    # Process properties
    for prop in node.findall("./Properties/*"):
        ptype = prop.tag
        pname = prop.get("name")
        value = prop.text or ""
        formatted = format_property(f"{name}.{pname}", ptype, value)
        if formatted:
            code += indent + formatted + "\n"

    # Process children
    for child in node.findall("./Item"):
        cname = child.get("name")
        code += convert_instance(child, depth+1)
        code += f'{indent}{cname}.Parent = {name}\n'

    return code
