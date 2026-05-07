"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/store";
import type { League } from "@/lib/types";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export async function createLeague(formData: FormData) {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return redirect("/leagues/new?error=" + encodeURIComponent("Name 2–60 chars"));
  }
  // Ensure unique join code (try a few times).
  let code = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    if (!(await store.getLeagueByCode(code))) break;
    code = generateJoinCode();
  }
  const league: League = {
    id: uuid(),
    name: parsed.data.name,
    ownerId: user.id,
    joinCode: code,
    memberIds: [user.id],
    createdAt: new Date().toISOString(),
  };
  await store.saveLeague(league);
  revalidatePath("/leagues");
  redirect(`/leagues/${league.id}`);
}

const joinSchema = z.object({
  code: z.string().trim().min(4).max(10),
});

export async function joinLeague(formData: FormData) {
  const user = await requireUser();
  const parsed = joinSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return redirect("/leagues/join?error=" + encodeURIComponent("Invalid code"));
  }
  const league = await store.getLeagueByCode(parsed.data.code);
  if (!league) {
    return redirect("/leagues/join?error=" + encodeURIComponent("League not found"));
  }
  if (!league.memberIds.includes(user.id)) {
    league.memberIds.push(user.id);
    await store.saveLeague(league);
  }
  revalidatePath("/leagues");
  redirect(`/leagues/${league.id}`);
}

export async function leaveLeague(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("leagueId");
  if (typeof id !== "string") return;
  const league = await store.getLeague(id);
  if (!league) return;
  if (league.ownerId === user.id) {
    return redirect(`/leagues/${id}?error=` + encodeURIComponent("Owners can't leave"));
  }
  league.memberIds = league.memberIds.filter((x) => x !== user.id);
  await store.saveLeague(league);
  revalidatePath("/leagues");
  redirect("/leagues");
}
