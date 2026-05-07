import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import { store } from "./store";
import type { User } from "./types";

const COOKIE_NAME = "fcuk_user";

const ADMIN_NAMES = (process.env.ADMIN_NAMES ?? "admin")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies();
  const id = c.get(COOKIE_NAME)?.value;
  if (!id) return null;
  return store.getUser(id);
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export function isAdmin(u: User | null): boolean {
  if (!u) return false;
  if (ADMIN_NAMES.includes(u.displayName.toLowerCase())) return true;
  if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) return true;
  return false;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (!isAdmin(u)) throw new Error("FORBIDDEN");
  return u;
}

export async function loginAs(displayName: string): Promise<User> {
  const cleaned = displayName.trim();
  if (!cleaned) throw new Error("Display name required");
  if (cleaned.length > 32) throw new Error("Display name too long");

  const existing = await store.getUserByName(cleaned);
  const user: User =
    existing ??
    {
      id: uuid(),
      displayName: cleaned,
      createdAt: new Date().toISOString(),
    };
  if (!existing) await store.upsertUser(user);

  const c = await cookies();
  c.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return user;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
