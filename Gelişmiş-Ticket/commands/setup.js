import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import TicketSettings from '../models/TicketSettings.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup the ticket system')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption(option => 
    option.setName('support_role')
      .setDescription('The role that can see and respond to tickets')
      .setRequired(true))
  .addRoleOption(option => 
    option.setName('admin_role')
      .setDescription('The role that can manage the ticket system')
      .setRequired(true))
  .addChannelOption(option => 
    option.setName('log_channel')
      .setDescription('Channel where ticket logs will be sent')
      .setRequired(true));

export async function execute(interaction) {
  const supportRole = interaction.options.getRole('support_role');
  const adminRole = interaction.options.getRole('admin_role');
  const logChannel = interaction.options.getChannel('log_channel');
  
  // Default ticket categories
  const defaultCategories = [
    { name: 'General Support', description: 'General questions and assistance', emoji: '❓' },
    { name: 'Technical Support', description: 'Technical issues and troubleshooting', emoji: '🔧' },
    { name: 'Billing', description: 'Billing inquiries and payment issues', emoji: '💰' },
    { name: 'Report', description: 'Report users or issues', emoji: '🚨' }
  ];
  
  try {
    // Check if settings already exist for this guild
    let settings = await TicketSettings.findOne({ guildId: interaction.guild.id });
    
    if (settings) {
      // Update existing settings
      settings.supportRoleId = supportRole.id;
      settings.adminRoleId = adminRole.id;
      settings.ticketLogChannelId = logChannel.id;
    } else {
      // Create new settings
      settings = new TicketSettings({
        guildId: interaction.guild.id,
        supportRoleId: supportRole.id,
        adminRoleId: adminRole.id,
        ticketLogChannelId: logChannel.id,
        ticketCategories: defaultCategories
      });
    }
    
    await settings.save();
    
    // Create ticket panel embed
    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Ticket System')
      .setDescription('Need assistance? Click the button below to create a support ticket.')
      .setColor('#5865F2')
      .addFields(
        { name: 'Available Categories', value: defaultCategories.map(cat => `${cat.emoji} **${cat.name}**: ${cat.description}`).join('\n') }
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
    
    await interaction.reply({ content: 'Ticket system has been set up successfully!', ephemeral: true });
    
    // Send the ticket panel to the channel
    const message = await interaction.channel.send({ embeds: [embed], components: [row] });
    
    // Log the setup
    const logEmbed = new EmbedBuilder()
      .setTitle('Ticket System Setup')
      .setDescription(`Ticket system has been set up by ${interaction.user.tag}`)
      .setColor('#00FF00')
      .addFields(
        { name: 'Support Role', value: `<@&${supportRole.id}>`, inline: true },
        { name: 'Admin Role', value: `<@&${adminRole.id}>`, inline: true },
        { name: 'Log Channel', value: `<#${logChannel.id}>`, inline: true },
        { name: 'Panel Message', value: `[Jump to Message](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${message.id})` }
      )
      .setTimestamp();
    
    await logChannel.send({ embeds: [logEmbed] });
    
  } catch (error) {
    console.error('Error setting up ticket system:', error);
    await interaction.reply({ content: 'There was an error setting up the ticket system. Please try again.', ephemeral: true });
  }
}