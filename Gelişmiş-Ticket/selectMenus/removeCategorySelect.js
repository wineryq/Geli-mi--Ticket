import { EmbedBuilder } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'remove_category_select';

export async function execute(interaction) {
  try {
    // Get the selected category index
    const categoryIndex = parseInt(interaction.values[0]);
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings || categoryIndex >= settings.ticketCategories.length) {
      return interaction.update({ content: 'Invalid category selection.', components: [] });
    }
    
    // Get the category before removing it
    const removedCategory = settings.ticketCategories[categoryIndex];
    
    // Remove the category
    settings.ticketCategories.splice(categoryIndex, 1);
    await settings.save();
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('Category Removed')
      .setDescription(`The category "${removedCategory.name}" has been removed from the ticket system.`)
      .setColor('#FF0000')
      .setTimestamp();
    
    await interaction.update({ content: '', embeds: [embed], components: [] });
    
  } catch (error) {
    console.error('Error removing category:', error);
    await interaction.update({ content: 'There was an error removing the category.', components: [] });
  }
}