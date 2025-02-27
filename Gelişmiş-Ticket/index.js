import { Client, GatewayIntentBits, Partials, Collection, Events } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase } from './database/mongoose.js';

// Load environment variables
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Collections for commands and buttons
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load button handlers
const buttonsPath = path.join(__dirname, 'buttons');
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  
  for (const file of buttonFiles) {
    const filePath = path.join(buttonsPath, file);
    const button = await import(filePath);
    
    if ('customId' in button && 'execute' in button) {
      client.buttons.set(button.customId, button);
    } else {
      console.log(`[WARNING] The button at ${filePath} is missing a required "customId" or "execute" property.`);
    }
  }
}

// Load select menu handlers
const selectMenusPath = path.join(__dirname, 'selectMenus');
if (fs.existsSync(selectMenusPath)) {
  const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));
  
  for (const file of selectMenuFiles) {
    const filePath = path.join(selectMenusPath, file);
    const selectMenu = await import(filePath);
    
    if ('customId' in selectMenu && 'execute' in selectMenu) {
      client.selectMenus.set(selectMenu.customId, selectMenu);
    } else {
      console.log(`[WARNING] The select menu at ${filePath} is missing a required "customId" or "execute" property.`);
    }
  }
}

// Load modal handlers
const modalsPath = path.join(__dirname, 'modals');
if (fs.existsSync(modalsPath)) {
  const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));
  
  for (const file of modalFiles) {
    const filePath = path.join(modalsPath, file);
    const modal = await import(filePath);
    
    if ('customId' in modal && 'execute' in modal) {
      client.modals.set(modal.customId, modal);
    } else {
      console.log(`[WARNING] The modal at ${filePath} is missing a required "customId" or "execute" property.`);
    }
  }
}

// Event handler for when the client is ready
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Connect to MongoDB
  await connectDatabase();
  
  // Set bot status
  client.user.setActivity('for tickets', { type: 'WATCHING' });
});

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }
      
      await command.execute(interaction, client);
    } else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId) || 
                     client.buttons.find(btn => interaction.customId.startsWith(btn.customId.split(':')[0]));
      
      if (!button) {
        console.error(`No button matching ${interaction.customId} was found.`);
        return;
      }
      
      await button.execute(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId) ||
                         client.selectMenus.find(menu => interaction.customId.startsWith(menu.customId.split(':')[0]));
      
      if (!selectMenu) {
        console.error(`No select menu matching ${interaction.customId} was found.`);
        return;
      }
      
      await selectMenu.execute(interaction, client);
    } else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId) ||
                    client.modals.find(m => interaction.customId.startsWith(m.customId.split(':')[0]));
      
      if (!modal) {
        console.error(`No modal matching ${interaction.customId} was found.`);
        return;
      }
      
      await modal.execute(interaction, client);
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

