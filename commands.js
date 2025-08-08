const { sendLunchMessage } = require('./lunchNotifier');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('lunsj')
    .setDescription('Sender en lunsjmelding manuelt'),
  
  async execute(interaction) {
    await interaction.deferReply();
    try {
      await sendLunchMessage();
      await interaction.editReply("Lunsjmelding sendt!");
    } catch (error) {
      await interaction.editReply(`Feil: ${error.message}`);
    }
  },
};