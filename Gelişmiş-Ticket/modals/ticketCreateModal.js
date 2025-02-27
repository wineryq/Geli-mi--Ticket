import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'ticket_create_modal';

export async function execute(interaction, client) {
  try {
    // Get the input values
    const subject = interaction.fields.getTextInputValue('ticketSubject');
    const description = interaction.fields.getTextInputValue('ticketDescription');
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings) {
      return interaction.reply({ content: 'Ticket system has not been set up yet.', ephemeral: true });
    }
    
    // Check if user has reached the maximum number of open tickets
    const userOpenTickets = await Ticket.countDocuments({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      status: 'open'
    });
    
    if (userOpenTickets >= settings.maxTicketsPerUser) {
      return interaction.reply({
        content: `You have reached the maximum number of open tickets (${settings.maxTicketsPerUser}). Please close some of your existing tickets before creating a new one.`,
        ephemeral: true
      });
    }
    
    // Defer the reply to give us time to create the channel
    await interaction.deferReply({ ephemeral: true });
    
    // Increment ticket counter
    settings.ticketCounter += 1;
    await settings.save();
    
    // Create category selection menu
    const categoryRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`ticket_category:${settings.ticketCounter}`)
          .setPlaceholder('Select a category')
          .addOptions(settings.ticketCategories.map(category => ({
            label: category.name,
            description: category.description,
            value: category.name,
            emoji: category.emoji
          })))
      );
    
    await interaction.followUp({
      content: 'Please select a category for your ticket:',
      components: [categoryRow],
      ephemeral: true
    });
    
    // Store ticket data temporarily
    client.ticketData = client.ticketData || {};
    client.ticketData[`${interaction.guild.id}-${interaction.user.id}-${settings.ticketCounter}`] = {
      subject,
      description,
      ticketId: settings.ticketCounter.toString().padStart(4, '0')
    };
    
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // If we've already deferred, use followUp
    if (interaction.deferred) {
      await interaction.followUp({ content: 'There was an error creating your ticket. Please try again.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error creating your ticket. Please try again.', ephemeral: true });
    }
  }
}