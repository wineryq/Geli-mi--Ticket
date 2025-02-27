import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Configure ticket system settings')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View current ticket system settings'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('welcome')
      .setDescription('Set the welcome message for new tickets'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Set the closing message for tickets'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('categories')
      .setDescription('Manage ticket categories'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('max_tickets')
      .setDescription('Set the maximum number of tickets per user')
      .addIntegerOption(option => 
        option.setName('limit')
          .setDescription('Maximum number of open tickets per user')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  // Get guild settings
  let settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
  
  if (!settings) {
    return interaction.reply({ content: 'Ticket system has not been set up yet. Please use `/setup` first.', ephemeral: true });
  }
  
  switch (subcommand) {
    case 'view':
      const settingsEmbed = new EmbedBuilder()
        .setTitle('Ticket System Settings')
        .setColor('#5865F2')
        .addFields(
          { name: 'Support Role', value: `<@&${settings.supportRoleId}>`, inline: true },
          { name: 'Admin Role', value: `<@&${settings.adminRoleId}>`, inline: true },
          { name: 'Log Channel', value: `<#${settings.ticketLogChannelId}>`, inline: true },
          { name: 'Max Tickets Per User', value: settings.maxTicketsPerUser.toString(), inline: true },
          { name: 'Auto-Close Time', value: settings.autoCloseTime > 0 ? `${settings.autoCloseTime} hours` : 'Disabled', inline: true },
          { name: 'Ticket Counter', value: settings.ticketCounter.toString(), inline: true },
          { name: 'Welcome Message', value: settings.welcomeMessage },
          { name: 'Close Message', value: settings.closeMessage }
        )
        .setTimestamp();
      
      // Add categories field
      if (settings.ticketCategories.length > 0) {
        settingsEmbed.addFields({
          name: 'Ticket Categories',
          value: settings.ticketCategories.map(cat => `${cat.emoji} **${cat.name}**: ${cat.description}`).join('\n')
        });
      }
      
      await interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
      break;
      
    case 'welcome':
      // Create a modal for the welcome message
      const welcomeModal = new ModalBuilder()
        .setCustomId('settings_welcome_modal')
        .setTitle('Set Welcome Message');
      
      const welcomeInput = new TextInputBuilder()
        .setCustomId('welcomeMessage')
        .setLabel('Welcome Message')
        .setPlaceholder('Enter the welcome message for new tickets')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000)
        .setValue(settings.welcomeMessage);
      
      const welcomeRow = new ActionRowBuilder().addComponents(welcomeInput);
      welcomeModal.addComponents(welcomeRow);
      
      await interaction.showModal(welcomeModal);
      break;
      
    case 'close':
      // Create a modal for the close message
      const closeModal = new ModalBuilder()
        .setCustomId('settings_close_modal')
        .setTitle('Set Close Message');
      
      const closeInput = new TextInputBuilder()
        .setCustomId('closeMessage')
        .setLabel('Close Message')
        .setPlaceholder('Enter the message shown when tickets are closed')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000)
        .setValue(settings.closeMessage);
      
      const closeRow = new ActionRowBuilder().addComponents(closeInput);
      closeModal.addComponents(closeRow);
      
      await interaction.showModal(closeModal);
      break;
      
    case 'categories':
      // Create buttons for category management
      const categoryRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_category')
            .setLabel('Add Category')
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕'),
          new ButtonBuilder()
            .setCustomId('edit_categories')
            .setLabel('Edit Categories')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️'),
          new ButtonBuilder()
            .setCustomId('remove_category')
            .setLabel('Remove Category')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
        );
      
      // Create embed showing current categories
      const categoriesEmbed = new EmbedBuilder()
        .setTitle('Ticket Categories')
        .setDescription('Manage your ticket categories using the buttons below.')
        .setColor('#5865F2');
      
      if (settings.ticketCategories.length > 0) {
        categoriesEmbed.addFields({
          name: 'Current Categories',
          value: settings.ticketCategories.map((cat, index) => `${index + 1}. ${cat.emoji} **${cat.name}**: ${cat.description}`).join('\n')
        });
      } else {
        categoriesEmbed.addFields({
          name: 'Current Categories',
          value: 'No categories defined yet.'
        });
      }
      
      await interaction.reply({ embeds: [categoriesEmbed], components: [categoryRow], ephemeral: true });
      break;
      
    case 'max_tickets':
      const limit = interaction.options.getInteger('limit');
      
      settings.maxTicketsPerUser = limit;
      await settings.save();
      
      await interaction.reply({ content: `Maximum tickets per user has been set to ${limit}.`, ephemeral: true });
      break;
  }
}