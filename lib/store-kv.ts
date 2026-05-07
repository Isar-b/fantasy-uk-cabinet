import { Redis } from "@upstash/redis";
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

const KEY_PREFIX = process.env.KV_KEY_PREFIX ?? "fcuk:";

const K = {
  mps: `${KEY_PREFIX}mps`,
  roleAssignments: `${KEY_PREFIX}roleAssignments`,
  users: `${KEY_PREFIX}users`,
  userByName: (lc: string) => `${KEY_PREFIX}user:byname:${lc}`,
  cabinets: `${KEY_PREFIX}cabinets`,
  leagues: `${KEY_PREFIX}leagues`,
  leagueByCode: (uc: string) => `${KEY_PREFIX}league:bycode:${uc}`,
  settings: `${KEY_PREFIX}settings`,
};

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing Upstash/Vercel KV env vars: set UPSTASH_REDIS_REST_URL+TOKEN or KV_REST_API_URL+TOKEN"
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const r = getRedis();
  const v = await r.get<T>(key);
  return (v as T) ?? fallback;
}

async function setJson<T>(key: string, value: T): Promise<void> {
  const r = getRedis();
  await r.set(key, value);
}

export const kvStore: Store = {
  // MPs
  async listMPs() {
    return getJson<MP[]>(K.mps, []);
  },
  async getMP(id) {
    const all = await this.listMPs();
    return all.find((m) => m.id === id) ?? null;
  },
  async upsertMP(mp) {
    const all = await this.listMPs();
    const idx = all.findIndex((m) => m.id === mp.id);
    if (idx >= 0) all[idx] = mp;
    else all.push(mp);
    await setJson(K.mps, all);
  },

  // Role assignments
  async listRoleAssignments() {
    return getJson<RoleAssignment[]>(K.roleAssignments, []);
  },
  async addRoleAssignment(a) {
    const all = await this.listRoleAssignments();
    for (const existing of all) {
      if (
        existing.titleLabel === a.titleLabel &&
        (!existing.endDate || new Date(existing.endDate).getTime() > new Date(a.startDate).getTime())
      ) {
        existing.endDate = a.startDate;
      }
    }
    all.push(a);
    await setJson(K.roleAssignments, all);
  },
  async endRoleAssignment(mpId, titleLabel, endDate) {
    const all = await this.listRoleAssignments();
    for (const x of all) {
      if (x.mpId === mpId && x.titleLabel === titleLabel && !x.endDate) {
        x.endDate = endDate;
      }
    }
    await setJson(K.roleAssignments, all);
  },
  async replaceRoleAssignments(allNew) {
    await setJson(K.roleAssignments, allNew);
  },

  // Users
  async listUsers() {
    return getJson<User[]>(K.users, []);
  },
  async getUser(id) {
    const all = await this.listUsers();
    return all.find((u) => u.id === id) ?? null;
  },
  async getUserByName(displayName) {
    const lc = displayName.trim().toLowerCase();
    const id = await getRedis().get<string>(K.userByName(lc));
    if (!id) return null;
    return this.getUser(id);
  },
  async upsertUser(u) {
    const all = await this.listUsers();
    const idx = all.findIndex((x) => x.id === u.id);
    if (idx >= 0) all[idx] = u;
    else all.push(u);
    await setJson(K.users, all);
    await getRedis().set(K.userByName(u.displayName.toLowerCase()), u.id);
  },

  // Cabinets
  async getCabinet(userId) {
    const all = await this.listCabinets();
    return all.find((c) => c.userId === userId) ?? null;
  },
  async saveCabinet(c) {
    const all = await this.listCabinets();
    const idx = all.findIndex((x) => x.userId === c.userId);
    if (idx >= 0) all[idx] = c;
    else all.push(c);
    await setJson(K.cabinets, all);
  },
  async listCabinets() {
    return getJson<Cabinet[]>(K.cabinets, []);
  },

  // Leagues
  async listLeagues() {
    return getJson<League[]>(K.leagues, []);
  },
  async getLeague(id) {
    const all = await this.listLeagues();
    return all.find((l) => l.id === id) ?? null;
  },
  async getLeagueByCode(code) {
    const uc = code.trim().toUpperCase();
    const id = await getRedis().get<string>(K.leagueByCode(uc));
    if (!id) return null;
    return this.getLeague(id);
  },
  async saveLeague(l) {
    const all = await this.listLeagues();
    const idx = all.findIndex((x) => x.id === l.id);
    if (idx >= 0) all[idx] = l;
    else all.push(l);
    await setJson(K.leagues, all);
    await getRedis().set(K.leagueByCode(l.joinCode.toUpperCase()), l.id);
  },
  async listLeaguesForUser(userId) {
    const all = await this.listLeagues();
    return all.filter((l) => l.memberIds.includes(userId));
  },

  // Settings
  async getSettings() {
    return getJson<Settings>(K.settings, {
      freezeAll: false,
      swapDeadline: SWAP_DEADLINE,
      scoringDate: SCORING_DATE,
    });
  },
  async saveSettings(s) {
    await setJson(K.settings, s);
  },
};
