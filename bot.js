const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

// Initialize the client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let leaderboard = {};
let currentPrompt = "";

// Helper function to extract score information and prompt
function parseEruptleMessage(message) {
  const eruptleRegex = /🤔\s*(.*?)\s*\n.*🎯\s*Score:\s*(\d+)/s;
  const match = message.match(eruptleRegex);

  if (match) {
    let prompt = match[1].trim();
    const score = parseInt(match[2], 10);

    // Strip out "Day XX - " if present
    const dayPattern = /^Day \d+ - /;
    prompt = prompt.replace(dayPattern, "").trim();

    return { prompt, score };
  }
  return null;
}

// Function to update the leaderboard with scores from the last 100 messages
async function updateLeaderboardFromRecentMessages(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  messages.forEach((msg) => {
    if (msg.author.bot) return;

    const parsedResult = parseEruptleMessage(msg.content);
    if (parsedResult && parsedResult.prompt === currentPrompt) {
      const { score } = parsedResult;
      const username = msg.author.username;

      leaderboard[username] = score;
    }
  });
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log(`Received message: ${message.content}`);

  const parsedResult = parseEruptleMessage(message.content);

  console.log(`Parsed result: ${JSON.stringify(parsedResult)}`);
  if (parsedResult) {
    const { prompt, score } = parsedResult;
    const username = message.author.username;

    // Reset leaderboard if the prompt has changed
    if (prompt !== currentPrompt) {
      currentPrompt = prompt;
      leaderboard = {};
    }

    // Update leaderboard with the current message
    leaderboard[username] = score;

    // Check the last 100 messages and update leaderboard with any other scores for the current prompt
    await updateLeaderboardFromRecentMessages(message.channel);

    // Sort the scores in descending order
    const sortedScores = Object.entries(leaderboard).sort(
      (a, b) => b[1] - a[1]
    );

    // Find the highest score
    const maxScore = sortedScores[0][1];

    // Array of emojis for rankings 2 through 10
    const rankEmojis = ["🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    // Build the leaderboard message
    let leaderboardMessage = `🌋 "${currentPrompt}" Leaderboard\n`;

    sortedScores.forEach(([user, score], index) => {
      if (score === maxScore) {
        leaderboardMessage += `🏆 ${user}: ${score}\n`;
      } else if (index < rankEmojis.length) {
        leaderboardMessage += `${rankEmojis[index]} ${user}: ${score}\n`;
      } else {
        leaderboardMessage += `${index + 1}. ${user}: ${score}\n`;
      }
    });

    // Send updated leaderboard
    message.channel.send(leaderboardMessage);
  }
});

// Ensure DISCORD_TOKEN is defined
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is not defined in the environment.");
  process.exit(1);
}

// Log in the client
client.login(token).catch(console.error);

console.log("Bot is running...");
