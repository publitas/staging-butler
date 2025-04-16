// slack_staging_reservation_bot.js

const { App } = require('@slack/bolt');
const fs = require('fs');

const EMOJI_MAP_PATH = './emoji_map.json';

function loadEmojiMap() {
  try {
    return JSON.parse(fs.readFileSync(EMOJI_MAP_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveEmojiMap(map) {
  fs.writeFileSync(EMOJI_MAP_PATH, JSON.stringify(map, null, 2));
}

const STAGING_CHANNEL = process.env.STAGING_CHANNEL;

if (!STAGING_CHANNEL) {
  console.error('[ERROR] STAGING_CHANNEL is not set. Exiting.');
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.command('/reserve', async ({ command, ack, respond, client }) => {
  await ack();

  const [subcommand, ...args] = command.text.trim().split(/\s+/);
  const emojiMap = loadEmojiMap();

  if (subcommand === 'status') {
    try {
      const result = await client.conversations.info({ channel: STAGING_CHANNEL });
      const currentText = result.channel.topic.value;

      const tokens = currentText.split(/\s+/);
      const reserved = [];
      const available = [];

      for (let i = 0; i < tokens.length - 1; i++) {
        const serverMatch = tokens[i].match(/(int\d+):/);
        const emojiMatch = tokens[i + 1].match(/^:.*:$/);

        if (serverMatch && emojiMatch) {
          const server = serverMatch[1];
          const emoji = tokens[i + 1];

          if (emoji === ':free:') {
            available.push(`• ${server}`);
          } else {
            reserved.push(`• ${server}${emoji ? ` → ${emoji}` : ''}`);
          }
        }
      }

      const responseLines = ['*🖥️ Server Reservations*', ''];

      if (reserved.length) {
        responseLines.push('*Reserved:*');
        responseLines.push(...reserved);
        responseLines.push('');
      } else {
        responseLines.push('*Reserved:*');
        responseLines.push('None');
        responseLines.push('');
      }

      if (available.length) {
        responseLines.push('*Available:*');
        responseLines.push(...available);
      } else {
        responseLines.push('*Available:*');
        responseLines.push('None');
      }

      await respond(responseLines.join('\n'));
    } catch (error) {
      console.error('[ERROR] Failed to retrieve server status.', error);
      await respond('Could not retrieve the server status.');
    }
    return;
  }

  if (subcommand === 'list-emojis') {
    if (Object.keys(emojiMap).length === 0) {
      await respond('🙈 No emoji mappings are currently set.');
      return;
    }
    const formatted = Object.entries(emojiMap)
      .map(([userId, emoji]) => `• <@${userId}> → ${emoji}`)
      .join('\n');
    await respond(`🗂️ *Emoji Mappings:*\n${formatted}`);
    return;
  }

  if (subcommand === 'set-emoji') {
    let userId;
    let emoji;

    if (args.length === 1) {
      userId = command.user_id;
      emoji = args[0];
    } else if (args.length === 2) {
      const userMention = args[0];
      emoji = args[1];

      const mentionMatch = userMention.match(/^<@([A-Z0-9]+)(\|[^>]+)?>$/);

      if (mentionMatch) {
        userId = mentionMatch[1];
      } else {
        try {
          const usersList = await client.users.list();
          const plainTextUsername = userMention.replace(/^@/, '').toLowerCase();
          const user = usersList.members.find((u) => {
            const name = u.name?.toLowerCase();
            const real = u.real_name?.toLowerCase();
            const display = u.profile?.display_name?.toLowerCase();
            return name === plainTextUsername || real === plainTextUsername || display === plainTextUsername;
          });

          if (user) {
            userId = user.id;
          } else {
            await respond('❌ Could not find user. Mention them properly or use their exact Slack @name.');
            return;
          }
        } catch (error) {
          console.error('[ERROR] Could not look up users:', error);
          await respond('❌ Failed to lookup Slack users.');
          return;
        }
      }
    } else {
      await respond('Usage: `/reserve set-emoji :emoji:` or `/reserve set-emoji @user :emoji:`');
      return;
    }

    emojiMap[userId] = emoji;
    saveEmojiMap(emojiMap);
    await respond(`Mapped <@${userId}> to ${emoji}`);
    return;
  }

  if (subcommand === 'release') {
    const server = args[0]?.toLowerCase();
    if (!server) {
      await respond('Usage: `/reserve release <server>`');
      return;
    }

    try {
      const result = await client.conversations.info({ channel: STAGING_CHANNEL });
      const originalText = result.channel.topic.value;
      const regex = new RegExp(`${server}:\\s+:[^:]+:`, 'i');

      if (!regex.test(originalText)) {
        await respond(`No reservation found for ${server}.`);
        return;
      }

      const updatedText = originalText.replace(regex, `${server}: :free:`);

      await client.conversations.setTopic({
        channel: STAGING_CHANNEL,
        topic: updatedText
      });

      await respond(`Server ${server} has been released and marked as :free:`);
    } catch (error) {
      console.error('[ERROR] Failed to release server.', error);
      await respond('Something went wrong while releasing the server.');
    }
    return;
  }

  // Default case: assume it's a reservation request like `/reserve int1`
  const server = subcommand?.toLowerCase();
  const userId = command.user_id;
  const emoji = emojiMap[userId];

  if (!server || !emoji) {
    await respond('Usage: `/reserve <server>` — but first set your emoji using `/reserve set-emoji :emoji:`');
    return;
  }

  try {
    const result = await client.conversations.info({ channel: STAGING_CHANNEL });
    const originalText = result.channel.topic.value;
    const regex = new RegExp(`${server}: :free:`, 'i');

    if (!regex.test(originalText)) {
      await respond(`Server ${server} is already reserved.`);
      return;
    }

    const updatedText = originalText.replace(regex, `${server}: ${emoji}`);

    await client.conversations.setTopic({
      channel: STAGING_CHANNEL,
      topic: updatedText
    });

    await respond(`Server ${server} has been reserved with ${emoji}`);
  } catch (error) {
    console.error('[ERROR] Failed to reserve server.', error);
    await respond(`Error: ${error.message || 'Something went wrong.'}`);
  }
});

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log('[INFO] Slack staging reservation bot is running!');

    const join = await app.client.conversations.join({ channel: STAGING_CHANNEL });
    if (join.already_in_channel) {
      console.log('[INFO] Bot is already in the staging channel.');
    } else {
      console.log('[INFO] Bot joined the staging channel.');
    }
  } catch (error) {
    console.error('[ERROR] Startup failure:', error);
  }
})();
