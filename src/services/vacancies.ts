import { load } from "cheerio";

import { logger } from "../logger.js";
import type { Vacancy } from "../types.js";

interface CacheEntry {
  expiresAt: number;
  data: Vacancy[];
}

let cache: CacheEntry | null = null;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(baseUrl: string, href: string): string {
  return new URL(href, baseUrl).toString();
}

function parseHeaderMeta(headerText: string): { location: string; employmentType: string; level: string } {
  const chunks = headerText
    .split(/(?=[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ])/)
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return {
    location: chunks[0] ?? "Remote",
    employmentType: chunks[1] ?? "full-time",
    level: chunks[2] ?? "senior"
  };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "user-agent": "XerionBot/1.0 (+Telegram)" }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseVacancyDetail(html: string, url: string): Vacancy | null {
  const $ = load(html);
  const title = normalizeText($("h1").first().text());

  if (!title) {
    return null;
  }

  const metaRaw = normalizeText($("h1").first().prevAll().first().text());
  const meta = parseHeaderMeta(metaRaw);

  const responsibilities: string[] = [];
  const requirements: string[] = [];
  const kpi: string[] = [];

  $("h3, h4").each((_i, el) => {
    const heading = normalizeText($(el).text()).toLowerCase();
    const items = $(el)
      .nextUntil("h3, h4")
      .find("li")
      .map((_idx, li) => normalizeText($(li).text()))
      .get()
      .filter(Boolean);

    if (heading.includes("що робити") || heading.includes("what you'll do")) {
      responsibilities.push(...items);
    } else if (heading.includes("вимоги") || heading.includes("requirements")) {
      requirements.push(...items);
    } else if (heading.includes("kpi")) {
      kpi.push(...items);
    }
  });

  const contactParagraph = $("body")
    .find("*:contains('Contact:')")
    .first();
  const contactText = normalizeText(contactParagraph.text());
  const contactName = contactText.replace(/.*Contact:\s*/i, "").trim() || undefined;

  const emailHref = $("a[href^='mailto:']").first().attr("href");
  const contactEmail = emailHref ? emailHref.replace(/^mailto:/i, "") : undefined;

  return {
    title,
    url,
    location: meta.location,
    employmentType: meta.employmentType,
    level: meta.level,
    responsibilities,
    requirements,
    kpi,
    contactName,
    contactEmail
  };
}

async function discoverVacancyLinks(baseUrl: string, careersPath: string): Promise<string[]> {
  const careersUrl = new URL(careersPath, baseUrl).toString();
  const html = await fetchHtml(careersUrl);
  const $ = load(html);

  const links = $("a[href*='/vacancies/']")
    .map((_i, el) => $(el).attr("href"))
    .get()
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((href) => toAbsoluteUrl(baseUrl, href));

  return [...new Set(links)];
}

export async function getVacancies(
  baseUrl: string,
  careersPath: string,
  fallbackVacancyPaths: string[],
  ttlSeconds: number
): Promise<Vacancy[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  try {
    const links = await discoverVacancyLinks(baseUrl, careersPath);
    if (!links.length) {
      for (const path of fallbackVacancyPaths) {
        links.push(new URL(path, baseUrl).toString());
      }
    }
    const records = await Promise.all(links.map(async (url) => parseVacancyDetail(await fetchHtml(url), url)));
    const result = records.filter((item): item is Vacancy => item !== null);

    cache = { data: result, expiresAt: now + ttlSeconds * 1000 };
    return result;
  } catch (error) {
    logger.error({ error }, "Failed to update vacancy cache");
    if (cache?.data.length) {
      return cache.data;
    }
    return [];
  }
}
