import os
import discord
from discord.ext import commands
from gui_converter import convert_instance
from lxml import etree
from io import BytesIO

# Read your bot token from Render environment variable
TOKEN = os.getenv("DISCORD_TOKEN")
if not TOKEN:
    raise RuntimeError("❌ DISCORD_TOKEN environment variable is not set!")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    print(f"✅ Bot is online as {bot.user}")


@bot.command()
async def convert(ctx):
    # Must attach a file
    if not ctx.message.attachments:
        return await ctx.reply("📁 **Please attach a .rbxmx or .rbxm file!**")

    file = ctx.message.attachments[0]

    # Validate file type
    if not file.filename.endswith((".rbxmx", ".rbxm")):
        return await ctx.reply("❌ File must be `.rbxmx` or `.rbxm`")

    data = await file.read()

    try:
        # Parse Roblox XML
        xml = etree.parse(BytesIO(data))
        root = xml.getroot()

        # Find the first GUI Item
        gui_root = root.find("Item")
        if gui_root is None:
            return await ctx.reply("❌ No GUI items found in the file.")

        # Convert to Lua
        lua_code = convert_instance(gui_root)

        # Return .lua file
        await ctx.reply(
            "✅ **GUI converted successfully!**",
            file=discord.File(
                fp=BytesIO(lua_code.encode()),
                filename="gui.lua"
            )
        )

    except Exception as e:
        await ctx.reply(
            f"❌ Error converting file:\n```\n{e}\n```"
        )


# Run bot
bot.run(TOKEN)
