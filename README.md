# Staging Butler

Slack bot to manage integration server reservations from a shared channel using `/reserve` commands.

---

## Features

- Reserve or release integration servers (e.g. `int1`, `int2`) with custom emoji
- View current status with `/reserve status`
- Map emojis to Slack users (or yourself)
- Clean and structured output
- Fully managed via channel topic for visibility

---

## Commands

| Command                            | Description                                      |
|------------------------------------|--------------------------------------------------|
| `/reserve int1`                    | Reserves `int1` with your emoji                  |
| `/reserve release int1`           | Releases `int1` back to `:free:`                 |
| `/reserve status`                 | Shows structured status of all servers           |
| `/reserve set-emoji :emoji:`      | Set your own emoji                               |
| `/reserve set-emoji @user :emoji:`| Set emoji for someone else (optional fallback)   |
| `/reserve list-emojis`           | Shows all emoji mappings                         |

---

## Setup

### 1. Clone and install
```bash
git clone git@github.com:youruser/staging-butler.git
cd staging-butler
npm install
```

### 2. Configure `.env`
Create a `.env` file:
```env
SLACK_BOT_TOKEN=your-xoxb-token
SLACK_SIGNING_SECRET=your-signing-secret
STAGING_CHANNEL=C0123456789
PORT=3000
```

### 3. Run the bot
```bash
node slack_staging_reservation_bot.js
```

---

## Local Development (ngrok)

If running locally, expose the bot with [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Use the public HTTPS URL from ngrok as your Slack command Request URL, e.g.:

```
https://clever-tiger.ngrok-free.app/reserve
```

---

## Slack Scopes Required

Your bot must have these **Bot Token Scopes**:

```
commands
users:read
channels:read
channels:manage
channels:join
groups:read
groups:write
```

Reinstall the app after updating scopes.

---

## Deployment on Fly.io (Optional)

If you want to deploy permanently:

1. [Install Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Run:
   ```bash
   fly launch --no-deploy
   ```
3. Set your secrets:
   ```bash
   fly secrets set SLACK_BOT_TOKEN=... SLACK_SIGNING_SECRET=... STAGING_CHANNEL=...
   ```
4. Deploy it:
   ```bash
   fly deploy
   ```

---

## License

Staging Butler is released under the [MIT License](https://opensource.org/licenses/MIT), the same license used by Ruby on Rails.
