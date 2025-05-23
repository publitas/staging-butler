# Staging Butler

[![Run Tests](https://github.com/publitas/staging-butler/actions/workflows/test.yml/badge.svg)](https://github.com/publitas/staging-butler/actions/workflows/test.yml)

Simple Slack bot that helps you and your team avoid stepping on each other when using shared integration servers.
No dashboards. No spreadsheets. Just a simple Slack bot that manages your staging environment.

---

## What It Does

- Reserves or releases staging servers like `int1`, `int2`, etc.
- Shows current state with `/reserve status`
- Tracks who has what using emoji
- Keeps everything visible by updating the channel topic
- Designates a first-line person
- Helps coordinate servers with team members
- Anyone can use it. Anyone can change emoji mappings.

![staging butler](https://github.com/user-attachments/assets/fd48ff77-1594-4c03-b6c9-82827027aeae)

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
DEBUG=false
EMOJI_MAP_PATH=./emoji_map.json
PORT=3000
SLACK_BOT_TOKEN=your-xoxb-token
SLACK_SIGNING_SECRET=your-signing-secret
STAGING_CHANNEL=C0123456789
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

The app requires persistent storage for the emoji mappings. Follow these simple steps to deploy:

```sh
# 1. Create a volume for persistent storage
fly volumes create data --region mad --size 1

# 2. Set required secrets
fly secrets set SLACK_BOT_TOKEN=... SLACK_SIGNING_SECRET=... STAGING_CHANNEL=...

# 3. Set the path to the emoji map file on the volume
fly secrets set EMOJI_MAP_PATH=/app/data/emoji_map.json

# 4. Deploy the app with a single machine (recommended for this simple bot)
fly deploy --ha=false
```

> **Important:** Use the `--ha=false` flag to deploy with just one machine. This is all you need for a simple Slack bot, and it avoids unnecessary complexity.

### Fly.toml Configuration

Your `fly.toml` file should have these settings to prevent the app from stopping automatically:

```toml
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = false
  min_machines_running = 1
  processes = ['app']

[mounts]
  source = "data"
  destination = "/app/data"
  processes = ["app"]
```

> **Note:** Use single brackets `[mounts]` not double brackets `[[mounts]]` for the mounts section.

### Starting Your App

If your app does stop for any reason, you can restart it with:

```sh
fly apps restart staging-butler
```

This is much easier than having to use machine IDs.

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

## Caching Strategy

Staging Butler implements a caching system to reduce Slack API rate-limiting issues. The caching system focuses on expensive API calls that are frequently made:

### What's Cached

1. **User List** - Cached for 1 hour
   - Reduces calls to `users.list` API
   - Used when looking up users by name

2. **Channel Info** - Cached for 5 minutes
   - Reduces calls to `conversations.info` API
   - Used when reading the channel topic

### Cache Invalidation

- The cache automatically expires based on TTL (Time To Live)
- Channel info cache is explicitly invalidated when the topic is updated
- User list cache is refreshed when it expires

### Debug Logging

The app includes debug-level logging for cache operations:
- Cache hits and misses
- Cache refreshes
- Cache invalidations

To enable debug logging, set the `DEBUG` environment variable:

```sh
# Local development
DEBUG=true npm start

# On Fly.io
fly secrets set DEBUG=true
```

This is particularly useful when troubleshooting rate-limiting issues.

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
│       ├── emojiStorage.js   # Emoji storage utility
│       └── cache.js          # Caching utility for API calls
├── emoji_map.json            # Who uses which emoji
├── .env                      # Your local config
├── .gitignore
├── package.json
├── LICENSE
└── README.md
```

## Testing

The Staging Butler testing strategy focuses on unit testing key utility components rather than comprehensive coverage of all bot functionality.

### Testing Philosophy

- Focus on critical utility functions that are used throughout the application
- Prioritize testing pure functions that don't require complex mocking
- Ensure core functionality works as expected

### Prioritized Components for Testing

1. **Cache Utility** (`src/utils/cache.js`)
   - Testing cache operations, TTL expiration, and invalidation

2. **Validators** (`src/utils/validators.js`)
   - Testing input validation functions like `isValidServer` and `isValidEmoji`

3. **Helpers** (`src/utils/helpers.js`)
   - Testing functions that parse and manipulate server status

### Running Tests

```sh
# Install Jest (if not already in package.json)
npm install --save-dev jest

# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

---

## License

MIT – do what you want.
