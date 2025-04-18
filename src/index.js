const { App } = require('@slack/bolt');
const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET,
  STAGING_CHANNEL,
  PORT
} = require('./config');
const logger = require('./utils/logger');
const commandHandlers = require('./commands');

if (!STAGING_CHANNEL) {
  logger.error('STAGING_CHANNEL is not set. Exiting.');
  process.exit(1);
}

if (!SLACK_BOT_TOKEN) {
  logger.error('SLACK_BOT_TOKEN is not set. Exiting.');
  process.exit(1);
}

if (!SLACK_SIGNING_SECRET) {
  logger.error('SLACK_SIGNING_SECRET is not set. Exiting.');
  process.exit(1);
}

// Initialize Slack app
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET
});

// Handle errors in the Slack app
app.error((error) => {
  logger.error('Unhandled error in Slack app', error);
});

// Register the /reserve command
app.command('/reserve', async ({ command, ack, respond, client }) => {
  await ack();
  logger.info(`Received command: /reserve ${command.text}`, { user: command.user_id });

  const [subcommand, ...args] = command.text.trim().split(/\s+/);

  // Handle subcommands
  switch (subcommand) {
    case 'status':
      await commandHandlers.status({ respond, client });
      break;

    case 'list-emojis':
      await commandHandlers.listEmojis({ respond });
      break;

    case 'set-emoji':
      await commandHandlers.setEmoji({ args, command, respond, client });
      break;

    case 'release':
      await commandHandlers.release({ command, args, respond, client });
      break;

    case 'help':
      await commandHandlers.help({ respond });
      break;

    case 'firstline':
      await commandHandlers.firstline({ args, command, respond, client });
      break;

    default:
      // Default case: assume it's a reservation request
      await commandHandlers.reserve({
        server: subcommand?.toLowerCase(),
        command,
        respond,
        client,
        args
      });
  }
});

(async () => {
  try {
    await app.start(PORT);
    logger.info(`Slack staging reservation bot is running on port ${PORT}!`);

    // Join channel by default. This avoids having to add the bot to the channel.
    const join = await app.client.conversations.join({ channel: STAGING_CHANNEL });

    if (join.already_in_channel) {
      logger.info('Bot is already in the staging channel.');
    } else {
      logger.info('Bot joined the staging channel.');
    }
  } catch (error) {
    logger.error('Startup failure', error);
    process.exit(1);
  }
})();
