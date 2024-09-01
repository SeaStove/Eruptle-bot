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
let currentDay = "";

// Helper function to extract score information
function parseEruptleMessage(message) {
  const eruptleRegex = /Day (\d+) - .*\n.*\n.*🎯 Score: (\d+)/;
  const match = message.match(eruptleRegex);

  if (match) {
    const day = match[1];
    const score = parseInt(match[2], 10);
    return { day, score };
  }
  return null;
}

// Function to update the leaderboard with scores from the last 100 messages
async function updateLeaderboardFromRecentMessages(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  messages.forEach((msg) => {
    if (msg.author.bot) return;

    const parsedResult = parseEruptleMessage(msg.content);
    if (parsedResult && parsedResult.day === currentDay) {
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
    const { day, score } = parsedResult;
    const username = message.author.username;

    // Reset leaderboard if the day has changed
    if (day !== currentDay) {
      currentDay = day;
      leaderboard = {};
    }

    // Update leaderboard with the current message
    leaderboard[username] = score;

    // Check the last 100 messages and update leaderboard with any other scores for the current day
    await updateLeaderboardFromRecentMessages(message.channel);

    // Determine the leader
    const leader = Object.entries(leaderboard).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );

    // Send updated leaderboard
    message.channel.send(
      `🏆 **Current Leaderboard (Day ${currentDay}):**\n${Object.entries(
        leaderboard
      )
        .map(([user, score]) => `${user}: ${score}`)
        .join("\n")}\n\n👑 **Top Score:** ${leader[0]} with ${leader[1]} points`
    );
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
