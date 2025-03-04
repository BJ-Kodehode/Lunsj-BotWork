const fs = require('fs');
const statsFile = 'stats.json';

function loadStats() {
  if (fs.existsSync(statsFile)) {
    return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  }
  return { messages: {}, reactions: {}, memes: {} };
}

function saveStats(stats) {
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

function incrementMessageCount(userId, type = 'messages') {
  const stats = loadStats();
  stats[type][userId] = (stats[type][userId] || 0) + 1;
  saveStats(stats);
}

function incrementReactionCount(userId) {
  const stats = loadStats();
  stats.reactions[userId] = (stats.reactions[userId] || 0) + 1;
  saveStats(stats);
}

function getTopUsers(type, count = 5) {
  const stats = loadStats();
  const sorted = Object.entries(stats[type] || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([userId, amount]) => `<@${userId}>: ${amount}`);
  return sorted.length ? sorted.join("\n") : "Ingen data ennå.";
}

module.exports = { incrementMessageCount, incrementReactionCount, getTopUsers };
