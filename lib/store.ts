import type {
  MP,
  RoleAssignment,
  Cabinet,
  League,
  User,
  Settings,
} from "./types";

export interface Store {
  // MPs
  listMPs(): Promise<MP[]>;
  getMP(id: string): Promise<MP | null>;
  upsertMP(mp: MP): Promise<void>;

  // Role assignments
  listRoleAssignments(): Promise<RoleAssignment[]>;
  addRoleAssignment(a: RoleAssignment): Promise<void>;
  endRoleAssignment(mpId: string, titleLabel: string, endDate: string): Promise<void>;
  replaceRoleAssignments(all: RoleAssignment[]): Promise<void>;

  // Users
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  getUserByName(displayName: string): Promise<User | null>;
  upsertUser(u: User): Promise<void>;

  // Cabinets
  getCabinet(userId: string): Promise<Cabinet | null>;
  saveCabinet(c: Cabinet): Promise<void>;
  listCabinets(): Promise<Cabinet[]>;

  // Leagues
  listLeagues(): Promise<League[]>;
  getLeague(id: string): Promise<League | null>;
  getLeagueByCode(code: string): Promise<League | null>;
  saveLeague(l: League): Promise<void>;
  listLeaguesForUser(userId: string): Promise<League[]>;

  // Settings
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
}

import { fsStore } from "./store-fs";

export const store: Store = fsStore;
