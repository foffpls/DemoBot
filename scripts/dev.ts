import { bot } from "../src/bot.js";
import { logger } from "../src/logger.js";

async function start(): Promise<void> {
  logger.info("Starting bot in local polling mode");
  await bot.start();
}

void start();
