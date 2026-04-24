import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(12).optional(),
  XERION_BASE_URL: z.string().url().default("https://xerion.team"),
  XERION_CAREERS_PATH: z.string().default("/careers"),
  XERION_FALLBACK_VACANCY_PATHS: z
    .string()
    .default("/vacancies/retention-manager-push-ios-pwa,/vacancies/senior-frontend-developer"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(21600)
});

export type AppConfig = z.infer<typeof envSchema>;

export function getConfig(): AppConfig {
  return envSchema.parse(process.env);
}
