import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import type { User } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";

export function Navbar({ user }: { user: User | null }) {
  const admin = isAdmin(user);
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold tracking-tight">
          🏛️ Fantasy UK Cabinet
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/pick" className="hover:underline">Pick squad</Link>
          <Link href="/my-cabinet" className="hover:underline">My cabinet</Link>
          <Link href="/leaderboard" className="hover:underline">Leaderboard</Link>
          <Link href="/leagues" className="hover:underline">Leagues</Link>
          <Link href="/rules" className="hover:underline">Rules</Link>
          {admin && (
            <Link href="/admin" className="hover:underline text-amber-600 dark:text-amber-400">
              Admin
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">
                {user.displayName}
              </span>
              <form action={logoutAction}>
                <button className="px-3 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
