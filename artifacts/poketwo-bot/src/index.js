const { Client } = require("discord.js-selfbot-v13");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const POKETWO_CHANNEL_ID = process.env.POKETWO_CHANNEL_ID;
const MESSAGE_CHANNEL_ID = process.env.MESSAGE_CHANNEL_ID;
const NAMING_BOT_ID = process.env.NAMING_BOT_ID;
const POKETWO_BOT_ID = "716390085896962058";

const WAKE_COMMAND = "quaxly wake";

const missing = [];
if (!DISCORD_TOKEN) missing.push("DISCORD_TOKEN");
if (!POKETWO_CHANNEL_ID) missing.push("POKETWO_CHANNEL_ID");
if (!MESSAGE_CHANNEL_ID) missing.push("MESSAGE_CHANNEL_ID");
if (!NAMING_BOT_ID) missing.push("NAMING_BOT_ID");

console.log("[INFO] DISCORD_TOKEN set:", !!DISCORD_TOKEN);
console.log("[INFO] POKETWO_CHANNEL_ID set:", !!POKETWO_CHANNEL_ID);
console.log("[INFO] MESSAGE_CHANNEL_ID set:", !!MESSAGE_CHANNEL_ID);
console.log("[INFO] NAMING_BOT_ID set:", !!NAMING_BOT_ID);

if (missing.length > 0) {
  console.error("[ERROR] Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const CAPTCHA_KEYWORDS = [
  "verify.poketwo.net",
  "human verification",
  "please verify",
  "you have been flagged",
  "suspicious activity",
  "complete the captcha",
  "verify that you are human",
  "banned",
];

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

let sleeping = false;
let messageTimer = null;

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

function isCaptchaMessage(content) {
  const lower = content.toLowerCase();
  return CAPTCHA_KEYWORDS.some((kw) => lower.includes(kw));
}

function goToSleep() {
  if (sleeping) return;
  sleeping = true;
  if (messageTimer) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }
  console.log("[CAPTCHA] Human verification detected! Bot is now SLEEPING.");
  console.log(`[CAPTCHA] Send "${WAKE_COMMAND}" in any channel to reactivate after completing captcha.`);
}

function wakeUp() {
  if (!sleeping) return;
  sleeping = false;
  console.log("[WAKE] Bot reactivated! Resuming catches and messages.");
  scheduleRandomMessage();
}

const client = new Client({ checkUpdate: false });

client.on("ready", () => {
  console.log(`[INFO] Logged in as ${client.user.tag}`);
  console.log(`[INFO] Watching for spawns in channel: ${POKETWO_CHANNEL_ID}`);
  console.log(`[INFO] Sending messages in channel: ${MESSAGE_CHANNEL_ID}`);
  console.log(`[INFO] Listening for naming bot: ${NAMING_BOT_ID}`);
  console.log(`[INFO] Wake command: "${WAKE_COMMAND}"`);

  scheduleRandomMessage();
});

function scheduleRandomMessage() {
  if (sleeping) return;

  const delay = randomDelay(3000, 4000);
  messageTimer = setTimeout(async () => {
    if (sleeping) return;

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
  if (message.author.id === client.user.id) {
    if (message.content.toLowerCase() === WAKE_COMMAND) {
      wakeUp();
    }
    return;
  }

  if (message.author.id === POKETWO_BOT_ID && isCaptchaMessage(message.content)) {
    goToSleep();
    return;
  }

  if (sleeping) return;

  if (message.channel.id === POKETWO_CHANNEL_ID) {
    console.log(`[DEBUG] Message in pokemon channel | author: ${message.author.id} (${message.author.username}) | content: "${message.content}"`);
  }

  if (message.author.id !== NAMING_BOT_ID) return;
  if (message.channel.id !== POKETWO_CHANNEL_ID) return;

  const contentToCheck = message.content
    || message.embeds?.[0]?.title
    || message.embeds?.[0]?.description
    || "";

  const pokemonName = extractPokemonName(contentToCheck);
  if (!pokemonName) {
    console.log(`[DEBUG] Could not extract name from: "${contentToCheck}"`);
    return;
  }

  console.log(`[SPAWN] Naming bot identified: ${pokemonName}`);

  const catchDelay = randomDelay(500, 1500);
  setTimeout(async () => {
    if (sleeping) return;
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
