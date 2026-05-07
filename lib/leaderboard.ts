import { score } from "./scoring";
import { store } from "./store";

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  totalPoints: number;
  pickedCount: number;
  totalCost: number;
  updatedAt: string;
};

export async function computeLeaderboard(
  userIds?: string[]
): Promise<LeaderboardRow[]> {
  const [users, cabinets, assignments] = await Promise.all([
    store.listUsers(),
    store.listCabinets(),
    store.listRoleAssignments(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const filterIds = userIds ? new Set(userIds) : null;

  const now = new Date();
  const rows: LeaderboardRow[] = [];
  const seen = new Set<string>();
  for (const c of cabinets) {
    if (filterIds && !filterIds.has(c.userId)) continue;
    const u = userMap.get(c.userId);
    if (!u) continue;
    const r = score({ picks: c.picks }, assignments, now);
    rows.push({
      userId: c.userId,
      displayName: u.displayName,
      totalPoints: r.totalPoints,
      pickedCount: c.picks.length,
      totalCost: c.totalCost,
      updatedAt: c.updatedAt,
    });
    seen.add(c.userId);
  }

  // Include users in the league who haven't picked yet (score 0).
  if (filterIds) {
    for (const id of filterIds) {
      if (seen.has(id)) continue;
      const u = userMap.get(id);
      if (!u) continue;
      rows.push({
        userId: id,
        displayName: u.displayName,
        totalPoints: 0,
        pickedCount: 0,
        totalCost: 0,
        updatedAt: u.createdAt,
      });
    }
  }

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });
  return rows;
}
