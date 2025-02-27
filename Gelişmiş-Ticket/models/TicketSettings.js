import mongoose from 'mongoose';

const ticketSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  supportRoleId: {
    type: String,
    default: null
  },
  adminRoleId: {
    type: String,
    default: null
  },
  ticketCategories: [{
    name: String,
    description: String,
    emoji: String
  }],
  ticketLogChannelId: {
    type: String,
    default: null
  },
  ticketCounter: {
    type: Number,
    default: 0
  },
  welcomeMessage: {
    type: String,
    default: "Thank you for creating a ticket. Support staff will be with you shortly."
  },
  closeMessage: {
    type: String,
    default: "This ticket has been closed. If you need further assistance, please create a new ticket."
  },
  autoCloseTime: {
    type: Number, // in hours, 0 means disabled
    default: 0
  },
  maxTicketsPerUser: {
    type: Number,
    default: 3
  }
});

export default mongoose.model('TicketSettings', ticketSettingsSchema);