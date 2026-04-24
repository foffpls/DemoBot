import { bot } from "../../src/bot.js";
import { getConfig } from "../../src/config.js";
import { logger } from "../../src/logger.js";
import type { Update } from "grammy/types";

const config = getConfig();

interface WebhookRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

interface WebhookResponse {
  status: (code: number) => WebhookResponse;
  send: (payload: string) => void;
  json: (payload: unknown) => void;
}

export default async function handler(req: WebhookRequest, res: WebhookResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const header = req.headers["x-telegram-bot-api-secret-token"];
  const secret = Array.isArray(header) ? header[0] : header;
  if (config.TELEGRAM_WEBHOOK_SECRET && secret !== config.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn("Webhook secret validation failed");
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    await bot.handleUpdate(req.body as Update);
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to process webhook update");
    res.status(500).json({ ok: false });
  }
}
