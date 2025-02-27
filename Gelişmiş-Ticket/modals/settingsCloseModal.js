import { EmbedBuilder } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'settings_close_modal';

export async function execute(interaction) {
  try {
    // Get the input value
    const closeMessage = interaction.fields.getTextInputValue('closeMessage');
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings) {
      return interaction.reply({ content: 'Ticket system has not been set up yet.', ephemeral: true });
    }
    
    // Update the close message
    settings.closeMessage = closeMessage;
    await settings.save();
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('Close Message Updated')
      .setDescription('The close message for tickets has been updated.')
      .addFields({ name: 'New Message', value: closeMessage })
      .setColor('#00FF00')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
  } catch (error) {
    console.error('Error updating close message:', error);
    await interaction.reply({ content: 'There was an error updating the close message.', ephemeral: true });
  }
}