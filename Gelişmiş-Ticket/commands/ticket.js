import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import Ticket from '../models/Ticket.js';
import TicketSettings from '../models/TicketSettings.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Manage tickets')
  .addSubcommand(subcommand =>
    subcommand
      .setName('panel')
      .setDescription('Create a new ticket panel'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Close the current ticket'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add a user to the ticket')
      .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove a user from the ticket')
      .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('rename')
      .setDescription('Rename the ticket')
      .addStringOption(option => option.setName('name').setDescription('The new name for the ticket').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('priority')
      .setDescription('Set the priority of the ticket'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('assign')
      .setDescription('Assign the ticket to a staff member')
      .addUserOption(option => option.setName('user').setDescription('The user to assign').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all open tickets'));

export async function execute(interaction, client) {
  const subcommand = interaction.options.getSubcommand();
  
  // Get guild settings
  const settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
  
  if (!settings) {
    return interaction.reply({ content: 'Ticket system has not been set up yet. Please use `/setup` first.', ephemeral: true });
  }
  
  // Check if user has permission (admin or support role)
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasPermission = member.roles.cache.has(settings.adminRoleId) || 
                        member.roles.cache.has(settings.supportRoleId) ||
                        member.permissions.has(PermissionFlagsBits.Administrator);
  
  switch (subcommand) {
    case 'panel':
      if (!hasPermission) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      
      // Create ticket panel embed
      const embed = new EmbedBuilder()
        .setTitle('🎫 Support Ticket System')
        .setDescription('Need assistance? Click the button below to create a support ticket.')
        .setColor('#5865F2')
        .addFields(
          { name: 'Available Categories', value: settings.ticketCategories.map(cat => `${cat.emoji} **${cat.name}**: ${cat.description}`).join('\n') }
        )
        .setFooter({ text: 'Advanced Ticket System' })
        .setTimestamp();
      
      // Create button for ticket creation
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );
      
      await interaction.reply({ content: 'Ticket panel created!', ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [row] });
      break;
      
    case 'close':
      // Check if the channel is a ticket
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticket) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      // Create confirmation buttons
      const confirmRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`close_ticket:${ticket.ticketId}:confirm`)
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`close_ticket:${ticket.ticketId}:cancel`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.reply({ 
        content: 'Are you sure you want to close this ticket? This action cannot be undone.', 
        components: [confirmRow],
        ephemeral: true 
      });
      break;
      
    case 'add':
      // Check if the channel is a ticket
      const ticketToAddUser = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticketToAddUser) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      const userToAdd = interaction.options.getUser('user');
      
      try {
        await interaction.channel.permissionOverwrites.edit(userToAdd.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });
        
        await interaction.reply({ content: `Added ${userToAdd} to the ticket.` });
        
        // Log the action
        const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('User Added to Ticket')
            .setDescription(`${userToAdd} was added to ticket #${ticketToAddUser.ticketId}`)
            .setColor('#00FF00')
            .addFields(
              { name: 'Added By', value: `${interaction.user.tag}`, inline: true },
              { name: 'Ticket', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('Error adding user to ticket:', error);
        await interaction.reply({ content: 'There was an error adding the user to the ticket.', ephemeral: true });
      }
      break;
      
    case 'remove':
      // Check if the channel is a ticket
      const ticketToRemoveUser = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticketToRemoveUser) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      const userToRemove = interaction.options.getUser('user');
      
      // Don't allow removing the ticket creator
      if (userToRemove.id === ticketToRemoveUser.userId) {
        return interaction.reply({ content: 'You cannot remove the ticket creator from the ticket.', ephemeral: true });
      }
      
      try {
        await interaction.channel.permissionOverwrites.delete(userToRemove.id);
        
        await interaction.reply({ content: `Removed ${userToRemove} from the ticket.` });
        
        // Log the action
        const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('User Removed from Ticket')
            .setDescription(`${userToRemove} was removed from ticket #${ticketToRemoveUser.ticketId}`)
            .setColor('#FF0000')
            .addFields(
              { name: 'Removed By', value: `${interaction.user.tag}`, inline: true },
              { name: 'Ticket', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('Error removing user from ticket:', error);
        await interaction.reply({ content: 'There was an error removing the user from the ticket.', ephemeral: true });
      }
      break;
      
    case 'rename':
      // Check if the channel is a ticket
      const ticketToRename = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticketToRename) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      const newName = interaction.options.getString('name');
      const formattedName = `ticket-${ticketToRename.ticketId}-${newName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      try {
        await interaction.channel.setName(formattedName);
        await interaction.reply({ content: `Ticket renamed to ${formattedName}.` });
        
        // Log the action
        const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Renamed')
            .setDescription(`Ticket #${ticketToRename.ticketId} was renamed`)
            .setColor('#FFA500')
            .addFields(
              { name: 'Renamed By', value: `${interaction.user.tag}`, inline: true },
              { name: 'New Name', value: formattedName, inline: true }
            )
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('Error renaming ticket:', error);
        await interaction.reply({ content: 'There was an error renaming the ticket.', ephemeral: true });
      }
      break;
      
    case 'priority':
      // Check if the channel is a ticket
      const ticketToSetPriority = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticketToSetPriority) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      // Create priority select menu
      const priorityRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`set_priority:${ticketToSetPriority.ticketId}`)
            .setPlaceholder('Select a priority level')
            .addOptions([
              {
                label: 'Low',
                description: 'Low priority issue',
                value: 'low',
                emoji: '🟢'
              },
              {
                label: 'Medium',
                description: 'Medium priority issue',
                value: 'medium',
                emoji: '🟡'
              },
              {
                label: 'High',
                description: 'High priority issue',
                value: 'high',
                emoji: '🟠'
              },
              {
                label: 'Urgent',
                description: 'Critical issue requiring immediate attention',
                value: 'urgent',
                emoji: '🔴'
              }
            ])
        );
      
      await interaction.reply({ 
        content: 'Select a priority level for this ticket:',
        components: [priorityRow]
      });
      break;
      
    case 'assign':
      // Check if the channel is a ticket
      const ticketToAssign = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticketToAssign) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
      }
      
      const userToAssign = interaction.options.getUser('user');
      
      // Check if the user is a staff member
      const assignMember = await interaction.guild.members.fetch(userToAssign.id).catch(() => null);
      if (!assignMember) {
        return interaction.reply({ content: 'Could not find that user in the server.', ephemeral: true });
      }
      
      const isStaff = assignMember.roles.cache.has(settings.adminRoleId) || 
                      assignMember.roles.cache.has(settings.supportRoleId) ||
                      assignMember.permissions.has(PermissionFlagsBits.Administrator);
      
      if (!isStaff) {
        return interaction.reply({ content: 'You can only assign tickets to staff members.', ephemeral: true });
      }
      
      try {
        ticketToAssign.assignedTo = userToAssign.id;
        await ticketToAssign.save();
        
        await interaction.reply({ content: `Ticket has been assigned to ${userToAssign}.` });
        
        // Log the action
        const logChannel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Assigned')
            .setDescription(`Ticket #${ticketToAssign.ticketId} was assigned to ${userToAssign.tag}`)
            .setColor('#5865F2')
            .addFields(
              { name: 'Assigned By', value: `${interaction.user.tag}`, inline: true },
              { name: 'Ticket', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error('Error assigning ticket:', error);
        await interaction.reply({ content: 'There was an error assigning the ticket.', ephemeral: true });
      }
      break;
      
    case 'list':
      if (!hasPermission) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      
      try {
        const openTickets = await Ticket.find({ 
          guildId: interaction.guild.id,
          status: 'open'
        });
        
        if (openTickets.length === 0) {
          return interaction.reply({ content: 'There are no open tickets.', ephemeral: true });
        }
        
        const ticketListEmbed = new EmbedBuilder()
          .setTitle('Open Tickets')
          .setDescription(`There are currently ${openTickets.length} open tickets.`)
          .setColor('#5865F2')
          .setTimestamp();
        
        for (const ticket of openTickets) {
          const creator = await client.users.fetch(ticket.userId).catch(() => ({ tag: 'Unknown User' }));
          const assignedTo = ticket.assignedTo ? 
            await client.users.fetch(ticket.assignedTo).catch(() => null) : null;
          
          const priorityEmoji = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            urgent: '🔴'
          };
          
          ticketListEmbed.addFields({
            name: `Ticket #${ticket.ticketId} - ${ticket.subject}`,
            value: `
              **Category:** ${ticket.category}
              **Created by:** ${creator.tag}
              **Priority:** ${priorityEmoji[ticket.priority]} ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              **Assigned to:** ${assignedTo ? assignedTo.tag : 'Unassigned'}
              **Channel:** <#${ticket.channelId}>
              **Created:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>
            `
          });
        }
        
        await interaction.reply({ embeds: [ticketListEmbed], ephemeral: true });
      } catch (error) {
        console.error('Error listing tickets:', error);
        await interaction.reply({ content: 'There was an error listing the tickets.', ephemeral: true });
      }
      break;
  }
}