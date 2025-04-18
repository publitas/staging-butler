# Staging Butler

Simple Slack bot that helps you and your team avoid stepping on each other when using shared integration servers.

No dashboards. No spreadsheets. Just a simple Slack bot that manages your staging environment.

---

## What It Does

- Reserves or releases staging servers like `int1`, `int2`, etc.
- Shows current state with `/reserve status`
- Tracks who has what using emoji
- Keeps everything visible by updating the channel topic
- Designates a firstline person for staging server issues
- Helps coordinate server releases with team members
- Anyone can use it. Anyone can change emoji mappings.

---

## Commands

| Command                             | What it does                                  |
|-------------------------------------|------------------------------------------------|
| `/reserve int1`                     | Shows who has reserved `int1`                  |
| `/reserve int1 @user`               | Reserves `int1` for the specified user         |
| `/reserve release`                  | Ask team if there's a server to release        |
| `/reserve release int1`             | Marks `int1` as :free:                         |
| `/reserve status`                   | Shows who's using what                         |
| `/reserve set-emoji :emoji:`        | Sets your emoji (for tagging reservations)     |
| `/reserve set-emoji @user :emoji:`  | Sets someone else's emoji                      |
| `/reserve list-emojis`              | Shows all emoji mappings                       |
| `/reserve firstline`                | Shows current firstline person                 |
| `/reserve firstline @user`          | Sets firstline person for staging issues       |
| `/reserve help`                     | Shows all available commands                   |

---

## Getting Started

### 1. Clone it

```sh
git clone git@github.com:publitas/staging-butler.git
cd staging-butler
```

### 2. Install deps

```sh
npm install
```

### 3. Create a `.env` file

```env
SLACK_BOT_TOKEN=your-xoxb-token
SLACK_SIGNING_SECRET=your-signing-secret
STAGING_CHANNEL=C0123456789
PORT=3000
```

---

## Running Locally (with ngrok)

You'll need a public URL for Slack to reach your bot. Use [ngrok](https://ngrok.com):

```sh
ngrok http 3000
```

Copy the HTTPS URL into your Slack app's Slash Command config (as the request URL).

---

## Deploying on Fly.io

```sh
fly launch
fly secrets set SLACK_BOT_TOKEN=... SLACK_SIGNING_SECRET=... STAGING_CHANNEL=...
fly deploy
```

---

## Slack Bot Scopes

You'll need these permissions:

```
commands
users:read
channels:read
channels:manage
channels:join
groups:read
groups:write
chat:write
```

The `chat:write` permission is required for features like:
- Posting firstline updates to the channel
- Asking the team about server releases
- Other interactive messages

Reinstall the bot after adding scopes.

---

## File Structure

```
staging-butler/
├── src/                      # Source code directory
│   ├── index.js              # Main application entry point
│   ├── config.js             # Configuration and constants
│   ├── commands/             # Command handlers
│   │   ├── index.js          # Command registry
│   │   ├── status.js         # Status command
│   │   ├── reserve.js        # Reserve command
│   │   ├── release.js        # Release command
│   │   ├── setEmoji.js       # Set emoji command
│   │   ├── listEmojis.js     # List emojis command
│   │   ├── firstline.js      # Firstline command
│   │   └── help.js           # Help command
│   └── utils/                # Utility functions
│       ├── logger.js         # Logging utility
│       ├── helpers.js        # Helper functions
│       ├── validators.js     # Validation functions
│       └── emojiStorage.js   # Emoji storage utility
├── emoji_map.json            # Who uses which emoji
├── .env                      # Your local config
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

---

## License

MIT – do what you want.
