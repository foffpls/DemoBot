import type { SupportedLocale } from "./types.js";

type Dictionary = Record<string, string>;

const translations: Record<SupportedLocale, Dictionary> = {
  uk: {
    welcome:
      "Вітаємо в *Xerion*.\nIT-компанія в affiliate marketing technology.\nОберіть розділ, щоб швидко отримати головне.",
    menuAbout: "Про нас",
    menuJobs: "Відкриті вакансії",
    menuContacts: "Контакти",
    menuSocials: "Соцмережі",
    aboutText:
      "Xerion створює технології для performance-маркетингу.\n\n• Власна CRM-платформа\n• Real-time аналітика та BI\n• Автоматизація процесів\n• Інфраструктура глобального масштабу\n\nМи поєднуємо інженерну якість, швидкість і бізнес-фокус.",
    contactsTitle: "Контакти Xerion",
    contactEmail: "Email",
    contactTelegram: "Telegram",
    contactLinkedin: "LinkedIn",
    socialsTitle: "Офіційні соцмережі Xerion",
    jobsLoading: "Підбираю актуальні вакансії Xerion...",
    jobsEmpty:
      "Зараз відкритих позицій не знайдено. Залишайтесь на звʼязку: ми регулярно відкриваємо нові ролі.",
    jobsHeader: "Відкриті вакансії Xerion",
    jobsApply: "Подати заявку",
    jobsMore: "Сторінка вакансії",
    unknown: "Я працюю через меню. Оберіть потрібний розділ нижче.",
    parseError: "Не вдалося завантажити вакансії. Спробуйте трохи пізніше.",
    startButton: "Відкрити меню",
    aboutButton: "Детальніше на сайті",
    contactsIntro: "Напишіть нам у зручний канал:",
    socialsIntro: "Слідкуйте за Xerion у публічних каналах:",
    vacancyMeta: "Формат",
    vacancyResponsibilities: "Ключові задачі",
    vacancyRequirements: "Вимоги",
    vacancyKpi: "KPI ролі",
    vacancyContact: "Контакт"
  },
  en: {
    welcome:
      "Welcome to *Xerion*.\nAn IT company in affiliate marketing technology.\nChoose a section to get the essentials instantly.",
    menuAbout: "About Us",
    menuJobs: "Open Vacancies",
    menuContacts: "Contacts",
    menuSocials: "Social Media",
    aboutText:
      "Xerion builds technology for performance marketing.\n\n• Proprietary CRM platform\n• Real-time analytics and BI\n• Workflow automation\n• Global-scale infrastructure\n\nWe combine engineering quality, speed, and business impact.",
    contactsTitle: "Xerion contacts",
    contactEmail: "Email",
    contactTelegram: "Telegram",
    contactLinkedin: "LinkedIn",
    socialsTitle: "Official Xerion social channels",
    jobsLoading: "Fetching current Xerion vacancies...",
    jobsEmpty:
      "No open roles are available right now. Stay connected - new positions are published regularly.",
    jobsHeader: "Open roles at Xerion",
    jobsApply: "Apply now",
    jobsMore: "View role page",
    unknown: "Please use the menu below to continue.",
    parseError: "Unable to load vacancies now. Please try again later.",
    startButton: "Open menu",
    aboutButton: "Learn more on website",
    contactsIntro: "Reach us through your preferred channel:",
    socialsIntro: "Follow Xerion across public channels:",
    vacancyMeta: "Format",
    vacancyResponsibilities: "Key responsibilities",
    vacancyRequirements: "Requirements",
    vacancyKpi: "Role KPI",
    vacancyContact: "Contact"
  }
};

export function resolveLocale(languageCode: string | undefined): SupportedLocale {
  if (!languageCode) {
    return "en";
  }

  const lowered = languageCode.toLowerCase();
  if (lowered.startsWith("uk") || lowered.startsWith("ua")) {
    return "uk";
  }

  return "en";
}

export function t(locale: SupportedLocale, key: string): string {
  return translations[locale][key] ?? translations.en[key] ?? key;
}
