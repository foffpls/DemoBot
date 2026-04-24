export type SupportedLocale = "uk" | "en";

export interface Vacancy {
  title: string;
  url: string;
  location: string;
  employmentType: string;
  level: string;
  responsibilities: string[];
  requirements: string[];
  kpi: string[];
  contactName?: string;
  contactEmail?: string;
}
