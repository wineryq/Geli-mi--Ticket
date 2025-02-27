import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const customId = 'ticket_priority';

export async function execute(interaction) {
  // Extract ticket ID from the custom ID
  const [, ticketId] = interaction.customId.split(':');
  
  // Create priority select menu
  const priorityRow = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`set_priority:${ticketId}`)
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
    components: [priorityRow],
    ephemeral: true
  });
}