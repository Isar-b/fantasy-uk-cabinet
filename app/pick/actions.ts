"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { BUDGET, SQUAD_SIZE, isPastDeadline } from "@/lib/dates";
import type { Cabinet } from "@/lib/types";

const pickSchema = z.object({
  mpId: z.string().min(1),
  predictedRole: z.string().min(1).max(120).optional().nullable(),
});

const schema = z.object({
  picks: z.array(pickSchema).length(SQUAD_SIZE),
});

export async function saveCabinet(input: { picks: { mpId: string; predictedRole?: string | null }[] }) {
  const user = await requireUser();
  const settings = await store.getSettings();
  if (settings.freezeAll || isPastDeadline(new Date(), settings.swapDeadline)) {
    return { ok: false as const, error: "Squads are locked" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid squad: must have exactly 10 picks" };
  }

  const ids = parsed.data.picks.map((p) => p.mpId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false as const, error: "Duplicate MPs in squad" };
  }

  const predictionLabels = parsed.data.picks
    .map((p) => p.predictedRole?.trim().toLowerCase())
    .filter((s): s is string => !!s);
  if (new Set(predictionLabels).size !== predictionLabels.length) {
    return { ok: false as const, error: "Each role can only be predicted once" };
  }

  const allMPs = await store.listMPs();
  const byId = new Map(allMPs.map((m) => [m.id, m]));
  let totalCost = 0;
  for (const id of ids) {
    const mp = byId.get(id);
    if (!mp) return { ok: false as const, error: `Unknown MP: ${id}` };
    if (!mp.active) return { ok: false as const, error: `MP not available: ${mp.name}` };
    totalCost += mp.price;
  }
  if (totalCost > BUDGET) {
    return { ok: false as const, error: `Over budget: £${totalCost.toFixed(2)} > £${BUDGET}` };
  }

  const knownRoles = new Set(
    (await import("@/data/known-roles.json")).default.map((r) =>
      r.titleLabel.toLowerCase()
    )
  );
  for (const p of parsed.data.picks) {
    if (p.predictedRole && !knownRoles.has(p.predictedRole.trim().toLowerCase())) {
      return {
        ok: false as const,
        error: `Unknown predicted role: ${p.predictedRole}`,
      };
    }
  }

  const cabinet: Cabinet = {
    userId: user.id,
    picks: parsed.data.picks.map((p) => ({
      mpId: p.mpId,
      predictedRole: p.predictedRole?.trim() || undefined,
    })),
    totalCost,
    updatedAt: new Date().toISOString(),
  };
  await store.saveCabinet(cabinet);
  revalidatePath("/pick");
  revalidatePath("/my-cabinet");
  revalidatePath("/leaderboard");
  return { ok: true as const, totalCost };
}
