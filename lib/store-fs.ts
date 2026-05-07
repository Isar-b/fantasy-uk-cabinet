import fs from "node:fs/promises";
import path from "node:path";
import type {
  MP,
  RoleAssignment,
  Cabinet,
  League,
  User,
  Settings,
} from "./types";
import type { Store } from "./store";
import { SCORING_DATE, SWAP_DEADLINE } from "./dates";

const DATA_DIR = path.join(process.cwd(), "data");

const FILES = {
  mps: path.join(DATA_DIR, "mps.json"),
  mpsSeed: path.join(DATA_DIR, "mps.seed.json"),
  roleAssignments: path.join(DATA_DIR, "role-assignments.json"),
  roleAssignmentsSeed: path.join(DATA_DIR, "role-assignments.seed.json"),
  users: path.join(DATA_DIR, "users.json"),
  cabinets: path.join(DATA_DIR, "cabinets.json"),
  leagues: path.join(DATA_DIR, "leagues.json"),
  settings: path.join(DATA_DIR, "settings.json"),
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonOrSeed<T>(file: string, seedFile: string | null, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const txt = await fs.readFile(file, "utf-8");
    return JSON.parse(txt) as T;
  } catch (e: unknown) {
    if (seedFile) {
      try {
        const txt = await fs.readFile(seedFile, "utf-8");
        const parsed = JSON.parse(txt) as T;
        await fs.writeFile(file, JSON.stringify(parsed, null, 2), "utf-8");
        return parsed;
      } catch {
        // fall through to fallback
      }
    }
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

const locks = new Map<string, Promise<void>>();
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const p = new Promise<void>((res) => (release = res));
  locks.set(key, prev.then(() => p));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (locks.get(key) === p) locks.delete(key);
  }
}

export const fsStore: Store = {
  // MPs
  async listMPs() {
    return readJsonOrSeed<MP[]>(FILES.mps, FILES.mpsSeed, []);
  },
  async getMP(id) {
    const all = await this.listMPs();
    return all.find((m) => m.id === id) ?? null;
  },
  async upsertMP(mp) {
    return withLock("mps", async () => {
      const all = await readJsonOrSeed<MP[]>(FILES.mps, FILES.mpsSeed, []);
      const idx = all.findIndex((m) => m.id === mp.id);
      if (idx >= 0) all[idx] = mp;
      else all.push(mp);
      await writeJson(FILES.mps, all);
    });
  },

  // Role assignments
  async listRoleAssignments() {
    return readJsonOrSeed<RoleAssignment[]>(
      FILES.roleAssignments,
      FILES.roleAssignmentsSeed,
      []
    );
  },
  async addRoleAssignment(a) {
    return withLock("roles", async () => {
      const all = await readJsonOrSeed<RoleAssignment[]>(
        FILES.roleAssignments,
        FILES.roleAssignmentsSeed,
        []
      );
      // End any active assignment for the same titleLabel (only one person can hold a role).
      const today = a.startDate;
      for (const existing of all) {
        if (
          existing.titleLabel === a.titleLabel &&
          (!existing.endDate || new Date(existing.endDate).getTime() > new Date(today).getTime())
        ) {
          existing.endDate = today;
        }
      }
      all.push(a);
      await writeJson(FILES.roleAssignments, all);
    });
  },
  async endRoleAssignment(mpId, titleLabel, endDate) {
    return withLock("roles", async () => {
      const all = await readJsonOrSeed<RoleAssignment[]>(
        FILES.roleAssignments,
        FILES.roleAssignmentsSeed,
        []
      );
      for (const a of all) {
        if (a.mpId === mpId && a.titleLabel === titleLabel && !a.endDate) {
          a.endDate = endDate;
        }
      }
      await writeJson(FILES.roleAssignments, all);
    });
  },
  async replaceRoleAssignments(allNew) {
    return withLock("roles", async () => {
      await writeJson(FILES.roleAssignments, allNew);
    });
  },

  // Users
  async listUsers() {
    return readJsonOrSeed<User[]>(FILES.users, null, []);
  },
  async getUser(id) {
    const all = await this.listUsers();
    return all.find((u) => u.id === id) ?? null;
  },
  async getUserByName(displayName) {
    const all = await this.listUsers();
    const lc = displayName.trim().toLowerCase();
    return all.find((u) => u.displayName.toLowerCase() === lc) ?? null;
  },
  async upsertUser(u) {
    return withLock("users", async () => {
      const all = await readJsonOrSeed<User[]>(FILES.users, null, []);
      const idx = all.findIndex((x) => x.id === u.id);
      if (idx >= 0) all[idx] = u;
      else all.push(u);
      await writeJson(FILES.users, all);
    });
  },

  // Cabinets
  async getCabinet(userId) {
    const all = await this.listCabinets();
    return all.find((c) => c.userId === userId) ?? null;
  },
  async saveCabinet(c) {
    return withLock("cabinets", async () => {
      const all = await readJsonOrSeed<Cabinet[]>(FILES.cabinets, null, []);
      const idx = all.findIndex((x) => x.userId === c.userId);
      if (idx >= 0) all[idx] = c;
      else all.push(c);
      await writeJson(FILES.cabinets, all);
    });
  },
  async listCabinets() {
    return readJsonOrSeed<Cabinet[]>(FILES.cabinets, null, []);
  },

  // Leagues
  async listLeagues() {
    return readJsonOrSeed<League[]>(FILES.leagues, null, []);
  },
  async getLeague(id) {
    const all = await this.listLeagues();
    return all.find((l) => l.id === id) ?? null;
  },
  async getLeagueByCode(code) {
    const all = await this.listLeagues();
    const uc = code.trim().toUpperCase();
    return all.find((l) => l.joinCode.toUpperCase() === uc) ?? null;
  },
  async saveLeague(l) {
    return withLock("leagues", async () => {
      const all = await readJsonOrSeed<League[]>(FILES.leagues, null, []);
      const idx = all.findIndex((x) => x.id === l.id);
      if (idx >= 0) all[idx] = l;
      else all.push(l);
      await writeJson(FILES.leagues, all);
    });
  },
  async listLeaguesForUser(userId) {
    const all = await this.listLeagues();
    return all.filter((l) => l.memberIds.includes(userId));
  },

  // Settings
  async getSettings() {
    return readJsonOrSeed<Settings>(FILES.settings, null, {
      freezeAll: false,
      swapDeadline: SWAP_DEADLINE,
      scoringDate: SCORING_DATE,
    });
  },
  async saveSettings(s) {
    return withLock("settings", async () => {
      await writeJson(FILES.settings, s);
    });
  },
};
