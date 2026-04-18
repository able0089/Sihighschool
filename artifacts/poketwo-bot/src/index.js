const { Client } = require("discord.js-selfbot-v13");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const POKETWO_CHANNEL_ID = process.env.POKETWO_CHANNEL_ID;
const MESSAGE_CHANNEL_ID = process.env.MESSAGE_CHANNEL_ID;
const NAMING_BOT_ID = process.env.NAMING_BOT_ID;
const POKETWO_BOT_ID = "716390085896962058";

if (!DISCORD_TOKEN || !POKETWO_CHANNEL_ID || !MESSAGE_CHANNEL_ID || !NAMING_BOT_ID) {
  console.error(
    "[ERROR] Missing required environment variables. Need: DISCORD_TOKEN, POKETWO_CHANNEL_ID, MESSAGE_CHANNEL_ID, NAMING_BOT_ID"
  );
  process.exit(1);
}

const RANDOM_PREFIXES = [
  "hey anyone here",
  "what's good",
  "lol this server",
  "just hanging out",
  "anyone wanna trade",
  "catching some pokemon rn",
  "gg",
  "this is fun",
  "yo",
  "not much going on",
  "back again",
  "been grinding all day",
  "pokemons be spawning",
  "nice catch btw",
  "what are yall up to",
  "just vibing",
  "anyone seen any legendaries",
  "wild day today",
  "collecting them all",
  "keeping it real out here",
];

function getRandomMessage() {
  const prefix = RANDOM_PREFIXES[Math.floor(Math.random() * RANDOM_PREFIXES.length)];
  return `${prefix} made by quaxly`;
}

function randomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function extractPokemonName(content) {
  const match = content.match(/That['']?s\s+\*{1,2}([^*!\n]+?)\*{0,2}[!.]?/i);
  if (match) {
    return match[1].trim().toLowerCase();
  }
  return null;
}

const client = new Client({ checkUpdate: false });

client.on("ready", () => {
  console.log(`[INFO] Logged in as ${client.user.tag}`);
  console.log(`[INFO] Watching for spawns in channel: ${POKETWO_CHANNEL_ID}`);
  console.log(`[INFO] Sending messages in channel: ${MESSAGE_CHANNEL_ID}`);
  console.log(`[INFO] Listening for naming bot: ${NAMING_BOT_ID}`);

  scheduleRandomMessage();
});

function scheduleRandomMessage() {
  const delay = randomDelay(3000, 4000);
  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(MESSAGE_CHANNEL_ID);
      if (channel && channel.isText()) {
        const msg = getRandomMessage();
        await channel.send(msg);
        console.log(`[MSG] Sent: "${msg}"`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to send random message: ${err.message}`);
    }
    scheduleRandomMessage();
  }, delay);
}

client.on("messageCreate", async (message) => {
  if (message.author.id !== NAMING_BOT_ID) return;
  if (message.channel.id !== POKETWO_CHANNEL_ID) return;

  const pokemonName = extractPokemonName(message.content);
  if (!pokemonName) return;

  console.log(`[SPAWN] Naming bot identified: ${pokemonName}`);

  const catchDelay = randomDelay(500, 1500);
  setTimeout(async () => {
    try {
      await message.channel.send(`<@${POKETWO_BOT_ID}> catch ${pokemonName}`);
      console.log(`[CATCH] Sent catch command for: ${pokemonName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to send catch command: ${err.message}`);
    }
  }, catchDelay);
});

client.login(DISCORD_TOKEN).catch((err) => {
  console.error(`[ERROR] Login failed: ${err.message}`);
  process.exit(1);
});
