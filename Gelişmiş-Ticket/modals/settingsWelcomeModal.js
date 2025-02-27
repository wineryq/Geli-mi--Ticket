import { EmbedBuilder } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'settings_welcome_modal';

export async function execute(interaction) {
  try {
    // Get the input value
    const welcomeMessage = interaction.fields.getTextInputValue('welcomeMessage');
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings) {
      return interaction.reply({ content: 'Ticket system has not been set up yet.', ephemeral: true });
    }
    
    // Update the welcome message
    settings.welcomeMessage = welcomeMessage;
    await settings.save();
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('Welcome Message Updated')
      .setDescription('The welcome message for new tickets has been updated.')
      .addFields({ name: 'New Message', value: welcomeMessage })
      .setColor('#00FF00')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
  } catch (error) {
    console.error('Error updating welcome message:', error);
    await interaction.reply({ content: 'There was an error updating the welcome message.', ephemeral: true });
  }
}