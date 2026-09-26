import { prisma } from "../prisma/client";

const DAY = 24 * 60 * 60 * 1000;

export const progressService = {
  async get(userId: string, days: number) {
    const since = new Date(Date.now() - days * DAY);
    const [checkins, completed, resources] = await Promise.all([
      prisma.moodCheckin.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
      prisma.resourceProgress.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: since } } }),
      prisma.wellnessResource.findMany({}),
    ]);
    const byId = new Map(resources.map((r) => [r.id, r]));

    const counts = new Map<string, number>();
    let minutes = 0;
    for (const p of completed) {
      minutes += byId.get(p.resourceId)?.duration ?? 0;
      counts.set(p.resourceId, (counts.get(p.resourceId) ?? 0) + 1);
    }
    const frequentResources = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .flatMap(([id, count]) => (byId.get(id) ? [{ id, title: byId.get(id)!.title, count }] : []));

    return {
      days,
      series: checkins.map((c) => ({
        date: c.createdAt.toISOString(),
        mood: c.mood,
        stress: c.stressLevel,
        energy: c.energyLevel,
        sleep: c.sleepQuality,
      })),
      activitiesCompleted: completed.length,
      activityMinutes: minutes,
      frequentResources,
    };
  },
};
