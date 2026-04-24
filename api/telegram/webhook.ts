import { bot } from "../../src/bot.js";
import { getConfig } from "../../src/config.js";
import { logger } from "../../src/logger.js";
import type { Update } from "grammy/types";

const config = getConfig();

interface NodeLikeRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface NodeLikeResponse {
  status?: (code: number) => NodeLikeResponse;
  send?: (payload: string) => void;
  json?: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (payload?: string) => void;
  statusCode?: number;
}

function isWebRequest(req: unknown): req is Request {
  return typeof req === "object" && req !== null && "headers" in req && typeof (req as Request).headers?.get === "function";
}

function getHeaderValue(req: Request | NodeLikeRequest, key: string): string | undefined {
  if (isWebRequest(req)) {
    return req.headers.get(key) ?? undefined;
  }
  const value = req.headers?.[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function getBody(req: Request | NodeLikeRequest): Promise<unknown> {
  if (isWebRequest(req)) {
    return req.json();
  }
  return req.body;
}

function sendNodeLike(res: NodeLikeResponse, code: number, payload: unknown): void {
  const statusFn = res.status;
  const jsonFn = res.json;
  if (typeof statusFn === "function" && typeof jsonFn === "function") {
    statusFn.call(res, code);
    jsonFn.call(res, payload);
    return;
  }

  res.statusCode = code;
  res.setHeader?.("content-type", "application/json; charset=utf-8");
  res.end?.(JSON.stringify(payload));
}

export default async function handler(req: Request | NodeLikeRequest, res?: NodeLikeResponse): Promise<Response | void> {
  const method = isWebRequest(req) ? req.method : req.method;
  if (method !== "POST") {
    if (isWebRequest(req)) {
      return new Response(JSON.stringify({ ok: false, message: "Method Not Allowed" }), { status: 405 });
    }
    if (res) {
      sendNodeLike(res, 405, { ok: false, message: "Method Not Allowed" });
    }
    return;
  }

  const secret = getHeaderValue(req, "x-telegram-bot-api-secret-token");
  if (config.TELEGRAM_WEBHOOK_SECRET && secret !== config.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn("Webhook secret validation failed");
    if (isWebRequest(req)) {
      return new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), { status: 401 });
    }
    if (res) {
      sendNodeLike(res, 401, { ok: false, message: "Unauthorized" });
    }
    return;
  }

  try {
    const body = await getBody(req);
    await bot.handleUpdate(body as Update);
    if (isWebRequest(req)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (res) {
      sendNodeLike(res, 200, { ok: true });
    }
  } catch (error) {
    logger.error({ error }, "Failed to process webhook update");
    if (isWebRequest(req)) {
      return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }
    if (res) {
      sendNodeLike(res, 500, { ok: false });
    }
  }
}
