import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export const customId = 'create_ticket';

export async function execute(interaction) {
  // Create a modal for ticket creation
  const modal = new ModalBuilder()
    .setCustomId('ticket_create_modal')
    .setTitle('Create a Support Ticket');
  
  // Add inputs to the modal
  const subjectInput = new TextInputBuilder()
    .setCustomId('ticketSubject')
    .setLabel('Subject')
    .setPlaceholder('Brief description of your issue')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);
  
  const descriptionInput = new TextInputBuilder()
    .setCustomId('ticketDescription')
    .setLabel('Description')
    .setPlaceholder('Please provide details about your issue')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);
  
  // Add inputs to action rows
  const subjectRow = new ActionRowBuilder().addComponents(subjectInput);
  const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
  
  // Add action rows to the modal
  modal.addComponents(subjectRow, descriptionRow);
  
  // Show the modal to the user
  await interaction.showModal(modal);
}