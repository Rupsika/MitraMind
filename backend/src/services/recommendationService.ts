import { prisma } from "../prisma/client";

const DAY = 24 * 60 * 60 * 1000;
const MAX_RECOMMENDATIONS = 3;

export type Category =
  | "STRESS"
  | "SLEEP"
  | "FOCUS"
  | "BREATHING"
  | "GROUNDING"
  | "STUDY_PRESSURE"
  | "GENERAL_WELLBEING";

export interface CheckinLike {
  mood: number;
  stressLevel: number;
  energyLevel: number;
  sleepQuality: number;
}

export interface CategoryPick {
  category: Category;
  reason: string;
}

/**
 * Deterministic content-based rules. Reasons describe what was recorded,
 * they do not label the user.
 */
export function pickCategories(checkin: CheckinLike | null): CategoryPick[] {
  const picks: CategoryPick[] = [];
  if (checkin) {
    if (checkin.stressLevel >= 7) picks.push({ category: "STRESS", reason: "Your latest check-in recorded a high stress level." });
    if (checkin.sleepQuality <= 4) picks.push({ category: "SLEEP", reason: "Your latest check-in recorded low sleep quality." });
    if (checkin.energyLevel <= 4) picks.push({ category: "GENERAL_WELLBEING", reason: "Your latest check-in recorded low energy. A gentle reset may help." });
    if (checkin.mood <= 3) picks.push({ category: "GROUNDING", reason: "Your latest check-in recorded a low mood. A grounding exercise can be a calm start." });
  }
  if (!picks.length) {
    picks.push({ category: "BREATHING", reason: "A short breathing practice is an easy way to pause during the day." });
  }
  return picks;
}

export const recommendationService = {
  async forUser(userId: string, language: string) {
    const [latest] = await prisma.moodCheckin.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 1 });
    const picks = pickCategories(latest ?? null);

    const [resources, recentProgress] = await Promise.all([
      prisma.wellnessResource.findMany({}),
      prisma.resourceProgress.findMany({
        where: { userId, status: "COMPLETED", startedAt: { gte: new Date(Date.now() - 3 * DAY) } },
      }),
    ]);
    const recentlyDone = new Set(recentProgress.map((p) => p.resourceId));

    const results: { resource: (typeof resources)[number]; reason: string }[] = [];
    for (const pick of picks) {
      const candidates = resources
        .filter((r) => r.category === pick.category && !recentlyDone.has(r.id) && !results.some((x) => x.resource.id === r.id))
        // Prefer the user's language, then English.
        .sort((a, b) => Number(b.language === language) - Number(a.language === language));
      if (candidates[0]) results.push({ resource: candidates[0], reason: pick.reason });
      if (results.length >= MAX_RECOMMENDATIONS) break;
    }

    // Record recommendations shown today (once per resource per day).
    const since = new Date(Date.now() - DAY);
    const existing = await prisma.recommendation.findMany({ where: { userId, createdAt: { gte: since } } });
    for (const r of results) {
      if (!existing.some((e) => e.resourceId === r.resource.id)) {
        await prisma.recommendation.create({ data: { userId, resourceId: r.resource.id, reason: r.reason } });
      }
    }
    return results;
  },
};
