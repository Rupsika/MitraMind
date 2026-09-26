/* Minimal in-memory stand-in for the Prisma client, covering only what the services use. */
import { randomUUID } from "crypto";

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const v = row[key];
    if (cond && typeof cond === "object" && !(cond instanceof Date)) {
      if ("gte" in cond && !(v >= cond.gte)) return false;
      if ("lt" in cond && !(v < cond.lt)) return false;
      if ("in" in cond && !cond.in.includes(v)) return false;
      return true;
    }
    return v === cond;
  });
}

function table(defaults: (row: Row) => Row = () => ({})) {
  const rows: Row[] = [];
  const sortBy = (list: Row[], orderBy?: Row) => {
    if (!orderBy) return list;
    const [[key, dir]] = Object.entries(orderBy);
    return [...list].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (dir === "desc" ? -1 : 1));
  };
  let tick = 0;
  return {
    rows,
    async create({ data }: { data: Row }) {
      const row = { id: randomUUID(), createdAt: new Date(Date.now() + tick++), ...defaults(data), ...data };
      rows.push(row);
      return { ...row };
    },
    async findUnique({ where }: { where: Row }) {
      const row = rows.find((r) => matches(r, where));
      return row ? { ...row } : null;
    },
    async findFirst({ where, orderBy }: { where?: Row; orderBy?: Row } = {}) {
      const row = sortBy(rows.filter((r) => matches(r, where)), orderBy)[0];
      return row ? { ...row } : null;
    },
    async findMany({ where, orderBy, take }: { where?: Row; orderBy?: Row; take?: number } = {}) {
      const list = sortBy(rows.filter((r) => matches(r, where)), orderBy).map((r) => ({ ...r }));
      return take ? list.slice(0, take) : list;
    },
    async update({ where, data }: { where: Row; data: Row }) {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error("not found");
      Object.assign(row, data, { updatedAt: new Date() });
      return { ...row };
    },
    async delete({ where }: { where: Row }) {
      const i = rows.findIndex((r) => matches(r, where));
      if (i >= 0) rows.splice(i, 1);
    },
  };
}

export function createFakePrisma() {
  const db = {
    user: table(() => ({ updatedAt: new Date() })),
    profile: table(),
    conversation: table((d) => ({ title: "New conversation", language: "en", updatedAt: new Date(), ...d })),
    message: table(),
    moodCheckin: table(),
    wellnessResource: table(),
    resourceProgress: table((d) => ({ startedAt: new Date(), status: "STARTED", completedAt: null, ...d })),
    recommendation: table(),
    safetyEvent: table(),
  };
  return db;
}
