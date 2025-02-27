import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export const customId = 'add_category';

export async function execute(interaction) {
  // Create a modal for adding a category
  const modal = new ModalBuilder()
    .setCustomId('add_category_modal')
    .setTitle('Add Ticket Category');
  
  // Add inputs to the modal
  const nameInput = new TextInputBuilder()
    .setCustomId('categoryName')
    .setLabel('Category Name')
    .setPlaceholder('e.g., Technical Support')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);
  
  const descriptionInput = new TextInputBuilder()
    .setCustomId('categoryDescription')
    .setLabel('Description')
    .setPlaceholder('Brief description of this category')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);
  
  const emojiInput = new TextInputBuilder()
    .setCustomId('categoryEmoji')
    .setLabel('Emoji')
    .setPlaceholder('Single emoji (e.g., 🔧)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(2);
  
  // Add inputs to action rows
  const nameRow = new ActionRowBuilder().addComponents(nameInput);
  const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
  const emojiRow = new ActionRowBuilder().addComponents(emojiInput);
  
  // Add action rows to the modal
  modal.addComponents(nameRow, descriptionRow, emojiRow);
  
  // Show the modal to the user
  await interaction.showModal(modal);
}