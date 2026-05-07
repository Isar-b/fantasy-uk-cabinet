"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAs, logout } from "@/lib/auth";
import { signIn, signOut, oauthEnabled } from "@/auth";

const schema = z.object({
  displayName: z.string().min(1).max(32),
});

export async function loginAction(formData: FormData) {
  if (oauthEnabled) {
    await signIn("google", { redirectTo: "/pick" });
    return;
  }
  const parsed = schema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    redirect("/login?error=" + encodeURIComponent("Display name 1–32 chars"));
  }
  await loginAs(parsed.data.displayName);
  redirect("/pick");
}

export async function logoutAction() {
  if (oauthEnabled) {
    await signOut({ redirectTo: "/" });
    return;
  }
  await logout();
  redirect("/");
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/pick" });
}
