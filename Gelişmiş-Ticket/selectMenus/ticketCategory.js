import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'ticket_category';

export async function execute(interaction, client) {
  try {
    // Extract ticket ID from the custom ID
    const [, ticketId] = interaction.customId.split(':');
    
    // Get the selected category
    const category = interaction.values[0];
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (!settings) {
      return interaction.update({ content: 'Ticket system has not been set up yet.', components: [] });
    }
    
    // Get the temporary ticket data
    const ticketData = client.ticketData[`${interaction.guild.id}-${interaction.user.id}-${ticketId}`];
    
    if (!ticketData) {
      return interaction.update({ content: 'Ticket data not found. Please try creating a new ticket.', components: [] });
    }
    
    // Update the interaction to show we're processing
    await interaction.update({ content: 'Creating your ticket...', components: [] });
    
    // Create the ticket channel
    const channelName = `ticket-${ticketData.ticketId}-${interaction.user.username.toLowerCase()}`;
    
    // Set up permissions for the channel
    const permissionOverwrites = [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }
    ];
    
    // Add support role permissions
    if (settings.supportRoleId) {
      permissionOverwrites.push({
        id: settings.supportRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    }
    
    // Add admin role permissions
    if (settings.adminRoleId) {
      permissionOverwrites.push({
        id: settings.adminRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    }
    
    // Create the channel
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: permissionOverwrites,
      topic: `Support ticket for ${interaction.user.tag} | ID: ${ticketData.ticketId} | Subject: ${ticketData.subject}`
    });
    
    // Create a new ticket in the database
    const ticket = new Ticket({
      ticketId: ticketData.ticketId,
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      category: category,
      subject: ticketData.subject,
      description: ticketData.description
    });
    
    await ticket.save();
    
    // Create ticket information embed
    const ticketEmbed = new EmbedBuilder()
      .setTitle .setTitle(`Ticket #${ticketData.ticketId} - ${ticketData.subject}`)
      .setDescription(`Thank you for creating a ticket. Support staff will be with you shortly.

**Category:** ${category}
**Description:**
${ticketData.description}`)
      .setColor('#5865F2')
      .setFooter({ text: `Ticket ID: ${ticketData.ticketId}` })
      .setTimestamp();
    
    // Create ticket control buttons
    const buttonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket:${ticketData.ticketId}:confirm`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId(`ticket_priority:${ticketData.ticketId}`)
          .setLabel('Set Priority')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔖')
      );
    
    // Send the welcome message
    await channel.send({ content: `Welcome ${interaction.user}! ${settings.welcomeMessage}`, embeds: [ticketEmbed], components: [buttonRow] });
    
    // Notify the user that the ticket has been created
    await interaction.followUp({ content: `Your ticket has been created: ${channel}`, ephemeral: true });
    
    // Log the ticket creation
    const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
    
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('New Ticket Created')
        .setDescription(`A new ticket has been created by ${interaction.user.tag}`)
        .setColor('#00FF00')
        .addFields(
          { name: 'Ticket ID', value: ticketData.ticketId, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Subject', value: ticketData.subject, inline: true },
          { name: 'Channel', value: `${channel}`, inline: true }
        )
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });
    }
    
    // Clean up temporary data
    delete client.ticketData[`${interaction.guild.id}-${interaction.user.id}-${ticketId}`];
    
  } catch (error) {
    console.error('Error creating ticket channel:', error);
    await interaction.followUp({ content: 'There was an error creating your ticket. Please try again.', ephemeral: true });
  }
}