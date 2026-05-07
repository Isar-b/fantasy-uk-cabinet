import fs from "node:fs/promises";
import path from "node:path";
import type { MP, RoleAssignment, Tier, RoleType } from "../lib/types";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");

const TIER_PRICE: Record<Tier, number> = {
  S: 16,
  A: 14,
  B: 10,
  C: 6,
  D: 3,
  E: 1,
};

type RoleOverride = { titleLabel: string; roleType: Exclude<RoleType, "none"> };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(name: string): string {
  return name
    .replace(/^(sir|dame|rt hon|the rt hon|dr|mrs|mr|ms)\s+/i, "")
    .replace(/\s+(mp|kc|qc|cbe|obe|mbe)$/i, "")
    .trim()
    .toLowerCase();
}

type ApiMember = {
  value: {
    id: number;
    nameDisplayAs: string;
    nameListAs: string;
    latestParty: { id: number; name: string };
    latestHouseMembership: {
      membershipFrom: string;
      house: number;
      membershipStatus: { statusIsActive?: boolean } | null;
    };
    thumbnailUrl?: string;
    gender?: string;
  };
};

const PARTY_LABOUR_ID = 15;

async function fetchAllLabourMPs(): Promise<ApiMember[]> {
  const all: ApiMember[] = [];
  let skip = 0;
  const take = 20;
  for (;;) {
    const url = `https://members-api.parliament.uk/api/Members/Search?House=1&IsCurrentMember=true&PartyId=${PARTY_LABOUR_ID}&take=${take}&skip=${skip}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      throw new Error(`Members API ${r.status}: ${await r.text()}`);
    }
    const data = (await r.json()) as { items: ApiMember[]; totalResults: number };
    all.push(...data.items);
    skip += take;
    process.stdout.write(`  fetched ${all.length}/${data.totalResults}\r`);
    if (skip >= data.totalResults) break;
  }
  process.stdout.write("\n");
  return all;
}

async function main() {
  console.log("Fetching all current Labour MPs from Parliament Members API…");
  const apiMembers = await fetchAllLabourMPs();
  console.log(`Got ${apiMembers.length} members.`);

  const overridesRaw = JSON.parse(
    await fs.readFile(path.join(DATA, "role-overrides.json"), "utf-8")
  ) as Record<string, RoleOverride | string>;
  // Strip _comment and key-suffix entries (like "Pat McFadden 2") used purely for JSON uniqueness.
  const overrides = new Map<string, RoleOverride>();
  for (const [k, v] of Object.entries(overridesRaw)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string") continue;
    const cleanKey = normalizeName(k.replace(/\s+\d+$/, ""));
    if (!overrides.has(cleanKey)) overrides.set(cleanKey, v);
  }

  const leadershipRaw = JSON.parse(
    await fs.readFile(path.join(DATA, "leadership-contenders.json"), "utf-8")
  ) as { names: string[] };
  const leadership = new Set(leadershipRaw.names.map(normalizeName));

  const dTierRaw = JSON.parse(
    await fs.readFile(path.join(DATA, "d-tier-mps.json"), "utf-8")
  ) as { names: string[] };
  const dTier = new Set(dTierRaw.names.map(normalizeName));

  const mps: MP[] = [];
  const roleAssignments: RoleAssignment[] = [];
  const seenSlugs = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);

  for (const m of apiMembers) {
    const v = m.value;
    const isActive = v.latestHouseMembership?.membershipStatus?.statusIsActive ?? true;
    if (!isActive) continue;

    const name = v.nameDisplayAs.replace(/\s+/g, " ").trim();
    const norm = normalizeName(name);
    let slug = slugify(name);
    if (seenSlugs.has(slug)) slug = `${slug}-${v.id}`;
    seenSlugs.add(slug);

    const override = overrides.get(norm);
    const isLeadership = leadership.has(norm);
    const isDTier = dTier.has(norm);
    let tier: Tier;
    if (override?.roleType === "pm" || isLeadership) {
      tier = "S";
    } else if (override?.roleType === "great_office") {
      tier = "A";
    } else if (override?.roleType === "cabinet") {
      tier = "B";
    } else if (override?.roleType === "attending") {
      tier = "C";
    } else if (isDTier) {
      tier = "D";
    } else {
      tier = "E";
    }

    const mp: MP = {
      id: slug,
      name,
      constituency: v.latestHouseMembership?.membershipFrom ?? "",
      party: v.latestParty?.name ?? "Labour",
      tier,
      price: TIER_PRICE[tier],
      photoUrl: v.thumbnailUrl,
      active: true,
    };
    mps.push(mp);

    if (override) {
      roleAssignments.push({
        mpId: slug,
        roleType: override.roleType,
        titleLabel: override.titleLabel,
        startDate: today,
        endDate: null,
      });
    }
  }

  // Special case: 'Pat McFadden 2' override (Work and Pensions) — apply as second role to McFadden if present.
  // Skip — leave to admin to manage manually if a person holds two roles.

  mps.sort((a, b) => a.name.localeCompare(b.name));

  await fs.writeFile(path.join(DATA, "mps.seed.json"), JSON.stringify(mps, null, 2));
  await fs.writeFile(
    path.join(DATA, "role-assignments.seed.json"),
    JSON.stringify(roleAssignments, null, 2)
  );

  // Wipe live caches so the seed takes effect. Remove the working files; the store
  // copies seeds into them on next read.
  for (const f of ["mps.json", "role-assignments.json"]) {
    const p = path.join(DATA, f);
    try {
      await fs.unlink(p);
    } catch {
      /* not present, ignore */
    }
  }

  const tierCounts = mps.reduce(
    (acc, m) => ((acc[m.tier] = (acc[m.tier] ?? 0) + 1), acc),
    {} as Record<string, number>
  );

  console.log(`Wrote ${mps.length} MPs to data/mps.seed.json`);
  console.log(`Tier counts:`, tierCounts);
  console.log(`Wrote ${roleAssignments.length} role assignments`);

  const apiNames = new Set(apiMembers.map((m) => normalizeName(m.value.nameDisplayAs)));
  const missingOverrides = Array.from(overrides.keys()).filter((k) => !apiNames.has(k));
  const missingD = Array.from(dTier).filter((k) => !apiNames.has(k));
  const missingS = Array.from(leadership).filter((k) => !apiNames.has(k));

  if (missingOverrides.length || missingD.length || missingS.length) {
    console.log("\nWARNING: these names had no exact match in the API:");
    for (const m of missingOverrides) console.log("  override:", m);
    for (const m of missingS) console.log("  leadership:", m);
    for (const m of missingD) console.log("  d-tier:", m);
    console.log("Edit the relevant JSON file so keys match Parliament's name format.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
