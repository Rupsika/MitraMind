import { prisma } from "../prisma/client";

const DAY = 24 * 60 * 60 * 1000;

type CheckinInput = { mood: number; stressLevel: number; energyLevel: number; sleepQuality: number; note?: string };
type Row = { mood: number; stressLevel: number; energyLevel: number; sleepQuality: number };

const METRICS = ["mood", "stressLevel", "energyLevel", "sleepQuality"] as const;
type Metric = (typeof METRICS)[number];

function averages(rows: Row[]): Record<Metric, number | null> {
  const out = {} as Record<Metric, number | null>;
  for (const m of METRICS) {
    out[m] = rows.length ? Math.round((rows.reduce((s, r) => s + r[m], 0) / rows.length) * 10) / 10 : null;
  }
  return out;
}

export const checkinService = {
  create: (userId: string, input: CheckinInput) => prisma.moodCheckin.create({ data: { userId, ...input } }),

  list: (userId: string, days = 30) =>
    prisma.moodCheckin.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - days * DAY) } },
      orderBy: { createdAt: "desc" },
    }),

  /**
   * Describes recorded patterns (this week vs. last week). Never interprets them
   * clinically: the client renders neutral sentences from `changes`.
   */
  async summary(userId: string) {
    const now = Date.now();
    const recent = await prisma.moodCheckin.findMany({
      where: { userId, createdAt: { gte: new Date(now - 14 * DAY) } },
      orderBy: { createdAt: "desc" },
    });
    const thisWeek = recent.filter((r) => r.createdAt.getTime() >= now - 7 * DAY);
    const lastWeek = recent.filter((r) => r.createdAt.getTime() < now - 7 * DAY);
    const cur = averages(thisWeek);
    const prev = averages(lastWeek);
    const changes = METRICS.flatMap((metric) => {
      const a = cur[metric];
      const b = prev[metric];
      if (a === null || b === null || Math.abs(a - b) < 1) return [];
      return [{ metric, direction: a > b ? ("higher" as const) : ("lower" as const), thisWeek: a, lastWeek: b }];
    });
    return { thisWeek: cur, lastWeek: prev, checkinsThisWeek: thisWeek.length, changes };
  },
};
