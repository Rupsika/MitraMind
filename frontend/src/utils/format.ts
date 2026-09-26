import type { Conversation, Lang, Source } from "../services/types";

const LOCALES: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN" };

export function greetingKey(date = new Date()): "greeting.morning" | "greeting.afternoon" | "greeting.evening" {
  const h = date.getHours();
  if (h < 12) return "greeting.morning";
  if (h < 17) return "greeting.afternoon";
  return "greeting.evening";
}

/** "who_mental_health_action_plan.txt" -> "who mental health action plan" */
export function sourceLabel(s: Source): string {
  const base = s.title.replace(/\.(txt|pdf|md)$/i, "").replace(/[_-]+/g, " ").trim();
  const label = base.charAt(0).toUpperCase() + base.slice(1);
  return s.page != null ? `${label} (p. ${s.page + 1})` : label;
}

export function shortDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(LOCALES[lang], { day: "numeric", month: "short" });
}

/** Groups conversations under Today / Yesterday / a short date, newest first. */
export function groupByDay(items: Conversation[], lang: Lang, labels: { today: string; yesterday: string }, now = new Date()) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const groups = new Map<string, Conversation[]>();
  for (const c of [...items].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))) {
    const day = startOfDay(new Date(c.updatedAt));
    const label =
      day === today ? labels.today : day === today - 86_400_000 ? labels.yesterday : shortDate(c.updatedAt, lang);
    groups.set(label, [...(groups.get(label) ?? []), c]);
  }
  return [...groups.entries()].map(([label, list]) => ({ label, items: list }));
}
