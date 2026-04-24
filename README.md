# Xerion Telegram Bot

Business-card Telegram bot for Xerion with multilingual UX and structured vacancy output from the official website.

## Features

- Clean menu with 4 sections:
  - About Us
  - Open Vacancies
  - Contacts
  - Social Media
- Automatic language selection based on Telegram user language (`uk` / `en` fallback).
- Vacancy discovery from Xerion careers pages and structured rendering.
- Dynamic extraction of social links and contact email from the website.
- Vercel-ready webhook endpoint and local polling mode for development.
- Strict config validation and in-memory TTL cache for fast responses.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Fill required variables:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET` (recommended for production)
- `WEBHOOK_SECRET_REQUIRED` (`true` by default, set `false` for simpler demo setup without secret header check)
- `XERION_FALLBACK_VACANCY_PATHS` as comma-separated paths for guaranteed fallback cards

## Development

Run local polling mode:

```bash
npm run dev
```

## Deploy To Vercel

Webhook handler is located at `api/telegram/webhook.ts`.

After deployment, set webhook in Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://<your-project>.vercel.app/api/webhook\",\"secret_token\":\"<your-secret>\"}"
```

## Quality Checks

```bash
npm run check
```
