# Staging Butler

Simple Slack bot that helps you and your team avoid stepping on each other when using shared integration servers.

No dashboards. No spreadsheets. Just `/reserve int1` and it updates the topic in Slack.

---

## What It Does

- Reserves or releases staging servers like `int1`, `int2`, etc.
- Shows current state with `/reserve status`
- Tracks who has what using emoji
- Keeps everything visible by updating the channel topic
- Anyone can use it. Anyone can change emoji mappings.

---

## Commands

| Command                             | What it does                                  |
|-------------------------------------|------------------------------------------------|
| `/reserve int1`                     | Reserves `int1` with your emoji                |
| `/reserve release int1`            | Marks `int1` as :free:                         |
| `/reserve status`                  | Shows who's using what                         |
| `/reserve set-emoji :emoji:`       | Sets your emoji (for tagging reservations)     |
| `/reserve set-emoji @user :emoji:` | Sets someone else's emoji                      |
| `/reserve list-emojis`            | Shows all emoji mappings                       |

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

You’ll need a public URL for Slack to reach your bot. Use [ngrok](https://ngrok.com):

```sh
ngrok http 3000
```

Copy the HTTPS URL into your Slack app’s Slash Command config (as the request URL).

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
```

Reinstall the bot after adding scopes.

---

## File Structure

```
staging-butler/
├── staging_butler_bot.js    # The actual bot
├── emoji_map.json           # Who uses which emoji
├── .env                     # Your local config
├── .gitignore
├── LICENSE
└── README.md
```

---

## License

MIT – do what you want.
