const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let leaderboard = {};
let currentDay = "";

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const eruptleRegex = /Day (\d+) - .*\n.*\n.*🎯 Score: (\d+)/;

  const match = message.content.match(eruptleRegex);

  if (match) {
    const day = match[1];
    const score = parseInt(match[2], 10);
    const username = message.author.username;

    // Reset leaderboard if the day has changed
    if (day !== currentDay) {
      currentDay = day;
      leaderboard = {};
    }

    // Update leaderboard
    leaderboard[username] = score;

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

const login = client.login(process.env.DISCORD_TOKEN);
login.catch(console.error);
