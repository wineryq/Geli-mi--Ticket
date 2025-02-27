import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'remove_category';

export async function execute(interaction) {
  try {
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings || settings.ticketCategories.length === 0) {
      return interaction.reply({ content: 'There are no categories to remove.', ephemeral: true });
    }
    
    // Create select menu for categories
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('remove_category_select')
      .setPlaceholder('Select a category to remove')
      .addOptions(settings.ticketCategories.map((category, index) => ({
        label: category.name,
        description: category.description,
        value: index.toString(),
        emoji: category.emoji
      })));
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({
      content: 'Select a category to remove:',
      components: [row],
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Error showing remove category menu:', error);
    await interaction.reply({ content: 'There was an error loading the categories.', ephemeral: true });
  }
}