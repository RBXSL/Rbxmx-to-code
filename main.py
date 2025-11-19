import os
import discord
from discord.ext import commands
from gui_converter import convert_instance
from lxml import etree
from io import BytesIO

# Use environment variable for token
TOKEN = os.getenv("DISCORD_TOKEN")
if not TOKEN:
    raise ValueError("DISCORD_TOKEN environment variable is not set!")

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Bot is online as {bot.user}")

@bot.command()
async def convert(ctx):
    if not ctx.message.attachments:
        return await ctx.reply("📁 **Attach a .rbxmx or .rbxm file!**")

    file = ctx.message.attachments[0]

    if not file.filename.endswith((".rbxmx", ".rbxm")):
        return await ctx.reply("❌ File must be `.rbxmx` or `.rbxm`.")

    data = await file.read()

    try:
        xml = etree.parse(BytesIO(data))
        root = xml.getroot()

        gui_root = root.find("Item")
        if gui_root is None:
            return await ctx.reply("❌ Could not find any GUI items in the file.")

        lua_code = convert_instance(gui_root)

        # Send converted Lua as a .lua file
        await ctx.reply(
            "✅ **GUI converted to Lua!**",
            file=discord.File(fp=BytesIO(lua_code.encode()), filename="gui.lua")
        )

    except Exception as e:
        await ctx.reply(f"❌ Error converting file:\n```\n{e}\n```")

bot.run(TOKEN)
