import { EmbedBuilder } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'add_category_modal';

export async function execute(interaction) {
  try {
    // Get the input values
    const name = interaction.fields.getTextInputValue('categoryName');
    const description = interaction.fields.getTextInputValue('categoryDescription');
    const emoji = interaction.fields.getTextInputValue('categoryEmoji');
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings) {
      return interaction.reply({ content: 'Ticket system has not been set up yet.', ephemeral: true });
    }
    
    // Check if category already exists
    const categoryExists = settings.ticketCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    
    if (categoryExists) {
      return interaction.reply({ content: `A category with the name "${name}" already exists.`, ephemeral: true });
    }
    
    // Add the new category
    settings.ticketCategories.push({
      name,
      description,
      emoji
    });
    
    await settings.save();
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('Category Added')
      .setDescription(`The category "${name}" has been added to the ticket system.`)
      .addFields(
        { name: 'Name', value: name, inline: true },
        { name: 'Description', value: description, inline: true },
        { name: 'Emoji', value: emoji, inline: true }
      )
      .setColor('#00FF00')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
  } catch (error) {
    console.error('Error adding category:', error);
    await interaction.reply({ content: 'There was an error adding the category.', ephemeral: true });
  }
}