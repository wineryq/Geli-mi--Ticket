import { EmbedBuilder } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketSettings from '../models/TicketSettings.js';

export const customId = 'set_priority';

export async function execute(interaction, client) {
  try {
    // Extract ticket ID from the custom ID
    const [, ticketId] = interaction.customId.split(':');
    
    // Get the selected priority
    const priority = interaction.values[0];
    
    // Find the ticket in the database
    const ticket = await Ticket.findOne({ ticketId });
    
    if (!ticket) {
      return interaction.update({ content: 'This ticket no longer exists.', components: [] });
    }
    
    // Update the ticket priority
    ticket.priority = priority;
    await ticket.save();
    
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    // Priority emoji mapping
    const priorityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    
    // Priority color mapping
    const priorityColor = {
      low: '#00FF00',
      medium: '#FFFF00',
      high: '#FFA500',
      urgent: '#FF0000'
    };
    
    // Update the interaction
    await interaction.update({ 
      content: `Ticket priority has been set to ${priorityEmoji[priority]} **${priority.charAt(0).toUpperCase() + priority.slice(1)}**`,
      components: [] 
    });
    
    // Log the priority change
    const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
    
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Priority Updated')
        .setDescription(`Ticket #${ticketId} priority has been updated to ${priority}`)
        .setColor(priorityColor[priority])
        .addFields(
          { name: 'Updated By', value: interaction.user.tag, inline: true },
          { name: 'Ticket', value: `<#${ticket.channelId}>`, inline: true }
        )
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });
    }
    
  } catch (error) {
    console.error('Error setting ticket priority:', error);
    await interaction.update({ content: 'There was an error setting the ticket priority.', components: [] });
  }
}