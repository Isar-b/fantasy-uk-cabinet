"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

const tierEnum = z.enum(["S", "A", "B", "C", "D", "E"]);

const upsertMPSchema = z.object({
  id: z.string().min(1),
  tier: tierEnum,
  price: z.coerce.number().min(0).max(50),
  active: z.coerce.boolean().optional(),
});

export async function updateMPAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = upsertMPSchema.safeParse({
    id: formData.get("id"),
    tier: formData.get("tier"),
    price: formData.get("price"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return;
  const mp = await store.getMP(parsed.data.id);
  if (!mp) return;
  await store.upsertMP({
    ...mp,
    tier: parsed.data.tier,
    price: parsed.data.price,
    active: parsed.data.active ?? mp.active,
  });
  revalidatePath("/admin");
  revalidatePath("/pick");
}

const addRoleSchema = z.object({
  mpId: z.string().min(1),
  titleLabel: z.string().min(1),
  startDate: z.string().min(8),
});

export async function addRoleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = addRoleSchema.safeParse({
    mpId: formData.get("mpId"),
    titleLabel: formData.get("titleLabel"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return;

  const known = (await import("@/data/known-roles.json")).default;
  const role = known.find((r) => r.titleLabel === parsed.data.titleLabel);
  if (!role) return;

  await store.addRoleAssignment({
    mpId: parsed.data.mpId,
    roleType: role.roleType as "pm" | "great_office" | "cabinet" | "attending",
    titleLabel: role.titleLabel,
    startDate: parsed.data.startDate,
    endDate: null,
  });
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/my-cabinet");
}

const endRoleSchema = z.object({
  mpId: z.string().min(1),
  titleLabel: z.string().min(1),
  endDate: z.string().min(8),
});

export async function endRoleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = endRoleSchema.safeParse({
    mpId: formData.get("mpId"),
    titleLabel: formData.get("titleLabel"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return;
  await store.endRoleAssignment(parsed.data.mpId, parsed.data.titleLabel, parsed.data.endDate);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/my-cabinet");
}

export async function setFreezeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const freeze = formData.get("freeze") === "on";
  const s = await store.getSettings();
  await store.saveSettings({ ...s, freezeAll: freeze });
  revalidatePath("/admin");
  revalidatePath("/pick");
}
