require('dotenv').config(); 
const client = require('./client'); 
const { scheduleLunchNotification } = require('./lunchNotifier'); 
const { incrementMessageCount, incrementReactionCount, getTopUsers } = require('./leaderboard');

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
  scheduleLunchNotification();
});

client.on('messageCreate', message => {
  if (!message.author.bot) {
    if (message.channel.id === process.env.MEME_CHANNEL_ID) {
      incrementMessageCount(message.author.id, 'memes');
    } else {
      incrementMessageCount(message.author.id, 'messages');
    }
  }
});

client.on('messageReactionAdd', (reaction, user) => {
  if (!user.bot) {
    incrementReactionCount(user.id);
  }
});

client.on('messageCreate', message => {
  if (message.content === '!leaderboard') {
    const topMessages = getTopUsers('messages');
    const topReactions = getTopUsers('reactions');
    const topMemes = getTopUsers('memes');

    message.channel.send(`📊 **Leaderboard** 📊\n\n💬 **Mest aktive brukere (meldinger):**  \n${topMessages}  \n\n👍 **Brukere med flest reaksjoner:**  \n${topReactions}  \n\n🤣 **Topp meme-postere:**  \n${topMemes}`);
  }
});

client.login(process.env.TOKEN)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));
