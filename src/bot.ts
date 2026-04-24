import { Bot, InlineKeyboard, Keyboard } from "grammy";
import type { Context } from "grammy";

import { getConfig } from "./config.js";
import { xerionContacts, xerionLinks } from "./content.js";
import { resolveLocale, t } from "./i18n.js";
import { logger } from "./logger.js";
import { getSiteProfile } from "./services/siteProfile.js";
import { getVacancies } from "./services/vacancies.js";
import type { SupportedLocale, Vacancy } from "./types.js";

const config = getConfig();
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

function escapeMarkdown(value: string): string {
  return value.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function getLocale(ctx: Context): SupportedLocale {
  return resolveLocale(ctx.from?.language_code);
}

function getMenuLabels(locale: SupportedLocale): Record<"about" | "jobs" | "contacts" | "socials", string> {
  if (locale === "uk") {
    return {
      about: "🏢 Про нас",
      jobs: "💼 Відкриті вакансії",
      contacts: "📞 Контакти",
      socials: "🌐 Соцмережі"
    };
  }

  return {
    about: "🏢 About Us",
    jobs: "💼 Open Vacancies",
    contacts: "📞 Contacts",
    socials: "🌐 Social Media"
  };
}

function createMainMenu(locale: SupportedLocale): Keyboard {
  const labels = getMenuLabels(locale);
  return new Keyboard()
    .text(labels.about)
    .row()
    .text(labels.jobs)
    .row()
    .text(labels.contacts)
    .row()
    .text(labels.socials)
    .resized()
    .persistent();
}

function resolveMenuAction(text: string): "about" | "jobs" | "contacts" | "socials" | null {
  const normalized = text.trim();
  const variants = [getMenuLabels("uk"), getMenuLabels("en")];

  for (const labels of variants) {
    if (normalized === labels.about) return "about";
    if (normalized === labels.jobs) return "jobs";
    if (normalized === labels.contacts) return "contacts";
    if (normalized === labels.socials) return "socials";
  }

  return null;
}

function vacancyToMessage(locale: SupportedLocale, vacancy: Vacancy): string {
  const title = escapeMarkdown(vacancy.title);
  const metaLine = `📍 ${escapeMarkdown(vacancy.location)} | ${escapeMarkdown(vacancy.employmentType)} | ${escapeMarkdown(vacancy.level)}`;
  const responsibilities = vacancy.responsibilities
    .slice(0, 4)
    .map((item) => `• ${escapeMarkdown(item)}`)
    .join("\n");
  const requirements = vacancy.requirements
    .slice(0, 4)
    .map((item) => `• ${escapeMarkdown(item)}`)
    .join("\n");
  const kpi = vacancy.kpi
    .slice(0, 3)
    .map((item) => `• ${escapeMarkdown(item)}`)
    .join("\n");

  return [
    `💼 *${title}*`,
    `🧭 *${t(locale, "vacancyMeta")}:* ${metaLine}`,
    responsibilities ? `\n🛠 *${t(locale, "vacancyResponsibilities")}:*\n${responsibilities}` : "",
    requirements ? `\n✅ *${t(locale, "vacancyRequirements")}:*\n${requirements}` : "",
    kpi ? `\n📈 *${t(locale, "vacancyKpi")}:*\n${kpi}` : "",
    vacancy.contactName ? `\n🤝 *${t(locale, "vacancyContact")}:* ${escapeMarkdown(vacancy.contactName)}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

async function showVacancies(ctx: Context): Promise<void> {
  const locale = getLocale(ctx);
  await ctx.reply(t(locale, "jobsLoading"), { reply_markup: createMainMenu(locale) });

  const vacancies = await getVacancies(
    config.XERION_BASE_URL,
    config.XERION_CAREERS_PATH,
    config.XERION_FALLBACK_VACANCY_PATHS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    config.CACHE_TTL_SECONDS
  );
  if (!vacancies.length) {
    await ctx.reply(t(locale, "jobsEmpty"), { reply_markup: createMainMenu(locale) });
    return;
  }

  await ctx.reply(`✨ ${t(locale, "jobsHeader")}`, { reply_markup: createMainMenu(locale) });
  for (const vacancy of vacancies) {
    const applyUrl = vacancy.url;
    await ctx.reply(vacancyToMessage(locale, vacancy), {
      parse_mode: "MarkdownV2",
      reply_markup: new InlineKeyboard()
        .url(t(locale, "jobsApply"), applyUrl)
        .row()
        .url(t(locale, "jobsMore"), vacancy.url)
    });
  }
}

bot.command("start", async (ctx) => {
  const locale = getLocale(ctx);
  await ctx.reply(t(locale, "welcome"), {
    reply_markup: createMainMenu(locale)
  });
});

bot.command("menu", async (ctx) => {
  const locale = getLocale(ctx);
  await ctx.reply(t(locale, "startButton"), {
    reply_markup: createMainMenu(locale)
  });
});

async function showAbout(ctx: Context): Promise<void> {
  const locale = getLocale(ctx);
  await ctx.reply(t(locale, "aboutText"), {
    reply_markup: new InlineKeyboard().url(t(locale, "aboutButton"), xerionLinks.website).row()
  });
}

async function showContacts(ctx: Context): Promise<void> {
  const locale = getLocale(ctx);

  const profile = await getSiteProfile(config.XERION_BASE_URL, config.CACHE_TTL_SECONDS);
  const email = profile.email ?? xerionContacts.email;
  const telegram = profile.telegram ?? xerionLinks.website;
  const linkedin = profile.linkedin ?? xerionLinks.website;

  const message = [
    `📌 ${t(locale, "contactsTitle")}`,
    "",
    t(locale, "contactsIntro"),
    "",
    `${t(locale, "contactEmail")}: ${email}`,
    `${t(locale, "contactTelegram")}: ${telegram}`,
    `${t(locale, "contactLinkedin")}: ${linkedin}`
  ].join("\n");

  await ctx.reply(message, { reply_markup: createMainMenu(locale) });
}

async function showSocials(ctx: Context): Promise<void> {
  const locale = getLocale(ctx);

  const profile = await getSiteProfile(config.XERION_BASE_URL, config.CACHE_TTL_SECONDS);
  const socialsKeyboard = new InlineKeyboard();

  if (profile.telegram) {
    socialsKeyboard.url("Telegram", profile.telegram).row();
  }
  if (profile.linkedin) {
    socialsKeyboard.url("LinkedIn", profile.linkedin).row();
  }
  socialsKeyboard.url("Website", xerionLinks.website);

  await ctx.reply(`🌐 ${t(locale, "socialsTitle")}\n\n${t(locale, "socialsIntro")}`, {
    reply_markup: socialsKeyboard
  });
}

bot.on("message:text", async (ctx) => {
  const locale = getLocale(ctx);
  const action = resolveMenuAction(ctx.message.text);

  if (action === "about") {
    await showAbout(ctx);
    return;
  }
  if (action === "jobs") {
    await showVacancies(ctx);
    return;
  }
  if (action === "contacts") {
    await showContacts(ctx);
    return;
  }
  if (action === "socials") {
    await showSocials(ctx);
    return;
  }

  await ctx.reply(t(locale, "unknown"), {
    reply_markup: createMainMenu(locale)
  });
});

bot.catch((error) => {
  logger.error({ error }, "Bot runtime error");
});
