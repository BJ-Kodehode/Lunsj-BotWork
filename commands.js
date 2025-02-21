const { sendLunchMessage } = require('./lunchNotifier');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('lunsj')
    .setDescription('Sender en lunsjmelding manuelt'),
  
  async execute(interaction) {
    await interaction.reply("Prøver å sende lunsjmelding...");
    try {
      await sendLunchMessage();
      interaction.followUp("Lunsjmelding sendt!");
    } catch (error) {
      interaction.followUp(`Feil: ${error.message}`);
    }
  },
};