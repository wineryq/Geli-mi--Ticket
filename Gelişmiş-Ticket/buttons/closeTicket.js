import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketSettings from '../models/TicketSettings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const customId = 'close_ticket';

export async function execute(interaction, client) {
  // Extract ticket ID and action from the custom ID
  const [, ticketId, action] = interaction.customId.split(':');
  
  if (action === 'cancel') {
    return interaction.update({ content: 'Ticket closure cancelled.', components: [] });
  }
  
  // Find the ticket in the database
  const ticket = await Ticket.findOne({ ticketId });
  
  if (!ticket) {
    return interaction.update({ content: 'This ticket no longer exists.', components: [] });
  }
  
  try {
    // Get guild settings
    const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    // Update ticket status in the database
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = interaction.user.id;
    await ticket.save();
    
    // Get the channel
    const channel = await interaction.guild.channels.fetch(ticket.channelId);
    
    // Create transcript
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = [];
    
    messages.reverse().forEach(msg => {
      const time = new Date(msg.createdTimestamp).toISOString();
      const author = msg.author.tag;
      const content = msg.content || '[No text content]';
      
      // Add attachments
      const attachments = msg.attachments.map(a => `[Attachment: ${a.name || 'file'}](${a.url})`).join(', ');
      
      transcript.push(`[${time}] ${author}: ${content}${attachments ? `\n${attachments}` : ''}`);
    });
    
    // Save transcript to a file
    const transcriptPath = path.join(__dirname, '..', 'transcripts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(transcriptPath)) {
      fs.mkdirSync(transcriptPath, { recursive: true });
    }
    
    const transcriptFile = path.join(transcriptPath, `ticket-${ticketId}.txt`);
    fs.writeFileSync(transcriptFile, transcript.join('\n\n'));
    
    // Create transcript attachment
    const attachment = new AttachmentBuilder(transcriptFile, { name: `ticket-${ticketId}.txt` });
    
    // Send close message
    const closeEmbed = new EmbedBuilder()
      .setTitle('Ticket Closed')
      .setDescription(settings.closeMessage || 'This ticket has been closed. If you need further assistance, please create a new ticket.')
      .setColor('#FF0000')
      .setTimestamp();
    
    await channel.send({ embeds: [closeEmbed] });
    
    // Log the closure
    const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
    
    if (logChannel) {
      const creator = await client.users.fetch(ticket.userId).catch(() => ({ tag: 'Unknown User' }));
      
      const logEmbed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .setDescription(`Ticket #${ticketId} has been closed by ${interaction.user.tag}`)
        .setColor('#FF0000')
        .addFields(
          { name: 'Subject', value: ticket.subject, inline: true },
          { name: 'Category', value: ticket.category, inline: true },
          { name: 'Created By', value: creator.tag, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
          { name: 'Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed], files: [attachment] });
    }
    
    // Update the interaction
    await interaction.update({ content: 'Ticket has been closed.', components: [] });
    
    // Archive and delete the channel after a delay
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error closing ticket:', error);
    await interaction.update({ content: 'There was an error closing the ticket.', components: [] });
  }
}