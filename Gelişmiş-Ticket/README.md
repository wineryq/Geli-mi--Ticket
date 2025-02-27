# Advanced Discord Ticket Bot Made By Winery

A feature-rich Discord ticket bot with an advanced menu system for managing support tickets.

## Features

- Interactive ticket creation with categories
- Customizable welcome and closing messages
- Priority levels for tickets (Low, Medium, High, Urgent)
- Ticket assignment to staff members
- Ticket transcripts
- Comprehensive logging
- Admin configuration commands
- Role-based permissions
- Multiple ticket categories
- User limits for open tickets

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Discord bot token and MongoDB URI:
   ```
   DISCORD_TOKEN=your_discord_token_here
   MONGODB_URI=your_mongodb_uri_here
   CLIENT_ID=your_client_id_here
   ```
4. Deploy slash commands with `node deploy-commands.js`
5. Start the bot with `npm start`

## Commands

- `/setup` - Initial setup of the ticket system
- `/ticket panel` - Create a new ticket panel
- `/ticket close` - Close the current ticket
- `/ticket add <user>` - Add a user to the ticket
- `/ticket remove <user>` - Remove a user from the ticket
- `/ticket rename <name>` - Rename the ticket
- `/ticket priority` - Set the priority of the ticket
- `/ticket assign <user>` - Assign the ticket to a staff member
- `/ticket list` - List all open tickets
- `/settings view` - View current ticket system settings
- `/settings welcome` - Set the welcome message for new tickets
- `/settings close` - Set the closing message for tickets
- `/settings categories` - Manage ticket categories
- `/settings max_tickets <limit>` - Set the maximum number of tickets per user

## License

MIT