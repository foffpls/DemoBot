import { load } from "cheerio";

export interface SiteProfile {
  email?: string;
  telegram?: string;
  linkedin?: string;
}

let cache: { expiresAt: number; data: SiteProfile } | null = null;

function normalizeUrl(href: string, baseUrl: string): string {
  return new URL(href, baseUrl).toString();
}

export async function getSiteProfile(baseUrl: string, ttlSeconds: number): Promise<SiteProfile> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  const response = await fetch(baseUrl, {
    method: "GET",
    headers: { "user-agent": "XerionBot/1.0 (+Telegram)" }
  });

  if (!response.ok) {
    return cache?.data ?? {};
  }

  const html = await response.text();
  const $ = load(html);

  const emailHref = $("a[href^='mailto:']").first().attr("href");
  const telegramHref = $("a[href*='t.me'], a[href*='telegram.me']").first().attr("href");
  const linkedinHref = $("a[href*='linkedin.com']").first().attr("href");

  const data: SiteProfile = {
    email: emailHref?.replace(/^mailto:/i, ""),
    telegram: telegramHref ? normalizeUrl(telegramHref, baseUrl) : undefined,
    linkedin: linkedinHref ? normalizeUrl(linkedinHref, baseUrl) : undefined
  };

  cache = { data, expiresAt: now + ttlSeconds * 1000 };
  return data;
}
