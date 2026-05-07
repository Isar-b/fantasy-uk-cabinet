// Seed Upstash Redis from local JSON files.
// Run after `npm run seed:mps` and ensure these env vars are set:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Or alternatively KV_REST_API_URL, KV_REST_API_TOKEN.
//
// Usage:
//   npm run seed:kv                  # seeds from data/*.seed.json (current cabinet snapshot)
//   npm run seed:kv -- --working     # seeds from data/{file}.json instead (your local working state)

import fs from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type {
  MP,
  RoleAssignment,
  Cabinet,
  League,
  User,
  Settings,
} from "../lib/types";
import { SCORING_DATE, SWAP_DEADLINE } from "../lib/dates";

const useWorking = process.argv.includes("--working");
const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const KEY_PREFIX = process.env.KV_KEY_PREFIX ?? "fcuk:";

async function readJsonOrEmpty<T>(file: string, fallback: T): Promise<T> {
  try {
    const txt = await fs.readFile(file, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

function pick(working: string, seed: string): string {
  return path.join(DATA, useWorking ? working : seed);
}

async function main() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Set UPSTASH_REDIS_REST_URL+TOKEN or KV_REST_API_URL+TOKEN before running."
    );
  }
  const redis = new Redis({ url, token });

  const mps = await readJsonOrEmpty<MP[]>(pick("mps.json", "mps.seed.json"), []);
  const roles = await readJsonOrEmpty<RoleAssignment[]>(
    pick("role-assignments.json", "role-assignments.seed.json"),
    []
  );
  const users = await readJsonOrEmpty<User[]>(path.join(DATA, "users.json"), []);
  const cabinets = await readJsonOrEmpty<Cabinet[]>(path.join(DATA, "cabinets.json"), []);
  const leagues = await readJsonOrEmpty<League[]>(path.join(DATA, "leagues.json"), []);
  const settings = await readJsonOrEmpty<Settings>(path.join(DATA, "settings.json"), {
    freezeAll: false,
    swapDeadline: SWAP_DEADLINE,
    scoringDate: SCORING_DATE,
  });

  console.log(`Seeding (prefix='${KEY_PREFIX}')`);
  console.log(`  ${mps.length} MPs`);
  console.log(`  ${roles.length} role assignments`);
  console.log(`  ${users.length} users`);
  console.log(`  ${cabinets.length} cabinets`);
  console.log(`  ${leagues.length} leagues`);
  console.log(`  source: ${useWorking ? "working files" : "seed files"}`);

  await redis.set(`${KEY_PREFIX}mps`, mps);
  await redis.set(`${KEY_PREFIX}roleAssignments`, roles);
  await redis.set(`${KEY_PREFIX}users`, users);
  await redis.set(`${KEY_PREFIX}cabinets`, cabinets);
  await redis.set(`${KEY_PREFIX}leagues`, leagues);
  await redis.set(`${KEY_PREFIX}settings`, settings);

  // Index keys (only matter for users/leagues lookups).
  for (const u of users) {
    await redis.set(`${KEY_PREFIX}user:byname:${u.displayName.toLowerCase()}`, u.id);
  }
  for (const l of leagues) {
    await redis.set(`${KEY_PREFIX}league:bycode:${l.joinCode.toUpperCase()}`, l.id);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
