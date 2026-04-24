import { bot } from "./bot.js";
import { logger } from "./logger.js";

async function start(): Promise<void> {
  logger.info("Starting bot in polling mode");
  await bot.start();
}

void start();
