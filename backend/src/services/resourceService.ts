import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { cacheGetOrSet } from "./redis";

type Filters = { category?: string; language?: string };

export const resourceService = {
  /** Resources are curated, non-sensitive and identical for all users, so they are safe to cache. */
  async list({ category, language }: Filters) {
    const all = await cacheGetOrSet("resources:all", 300, () =>
      prisma.wellnessResource.findMany({ orderBy: { title: "asc" } }),
    );
    return all.filter((r) => (!category || r.category === category) && (!language || r.language === language || r.language === "en"));
  },

  async get(id: string) {
    const resource = await prisma.wellnessResource.findUnique({ where: { id } });
    if (!resource) throw new AppError(404, "Resource not found", "not_found");
    return resource;
  },

  async start(userId: string, resourceId: string) {
    await this.get(resourceId);
    return prisma.resourceProgress.create({ data: { userId, resourceId, status: "STARTED" } });
  },

  async complete(userId: string, resourceId: string) {
    await this.get(resourceId);
    const open = await prisma.resourceProgress.findFirst({
      where: { userId, resourceId, status: "STARTED" },
      orderBy: { startedAt: "desc" },
    });
    if (open) {
      return prisma.resourceProgress.update({ where: { id: open.id }, data: { status: "COMPLETED", completedAt: new Date() } });
    }
    // Completing without an explicit start still counts.
    return prisma.resourceProgress.create({ data: { userId, resourceId, status: "COMPLETED", completedAt: new Date() } });
  },
};
