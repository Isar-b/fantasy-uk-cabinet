import type { Cabinet, RoleAssignment, RoleType } from "./types";

const BASE_POINTS: Record<RoleType, number> = {
  pm: 5,
  great_office: 3,
  cabinet: 2,
  attending: 1,
  none: 0,
};

const BONUS_POINTS: Record<RoleType, number> = {
  pm: 3,
  great_office: 2,
  cabinet: 1,
  attending: 0,
  none: 0,
};

export type PerMPScore = {
  mpId: string;
  roleType: RoleType;
  titleLabel: string | null;
  basePoints: number;
  bonusPoints: number;
  predictedRole: string | null;
  predictionHit: boolean;
};

export type ScoreResult = {
  totalPoints: number;
  perMP: PerMPScore[];
};

export function activeAssignmentForMP(
  mpId: string,
  assignments: RoleAssignment[],
  on: Date
): RoleAssignment | null {
  const t = on.getTime();
  const matches = assignments.filter((a) => {
    if (a.mpId !== mpId) return false;
    const start = new Date(a.startDate).getTime();
    if (start > t) return false;
    if (a.endDate) {
      const end = new Date(a.endDate).getTime();
      if (end <= t) return false;
    }
    return true;
  });
  if (matches.length === 0) return null;
  // If multiple, pick the highest-tier one (prevents weird overlaps).
  const order: RoleType[] = ["pm", "great_office", "cabinet", "attending"];
  matches.sort((a, b) => order.indexOf(a.roleType) - order.indexOf(b.roleType));
  return matches[0];
}

export function score(
  cabinet: Pick<Cabinet, "picks">,
  assignments: RoleAssignment[],
  on: Date
): ScoreResult {
  const perMP: PerMPScore[] = cabinet.picks.map((pick) => {
    const active = activeAssignmentForMP(pick.mpId, assignments, on);
    const roleType: RoleType = active?.roleType ?? "none";
    const titleLabel = active?.titleLabel ?? null;
    const basePoints = BASE_POINTS[roleType];

    const predictedRole = pick.predictedRole ?? null;
    const predictionHit =
      !!predictedRole &&
      !!active &&
      active.titleLabel.trim().toLowerCase() ===
        predictedRole.trim().toLowerCase();
    const bonusPoints = predictionHit ? BONUS_POINTS[roleType] : 0;

    return {
      mpId: pick.mpId,
      roleType,
      titleLabel,
      basePoints,
      bonusPoints,
      predictedRole,
      predictionHit,
    };
  });

  const totalPoints = perMP.reduce(
    (sum, p) => sum + p.basePoints + p.bonusPoints,
    0
  );

  return { totalPoints, perMP };
}
