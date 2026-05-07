import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import type { User } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";

export function Navbar({ user }: { user: User | null }) {
  const admin = isAdmin(user);
  return (
    <>
      {/* GOV.UK-style brand bar */}
      <header className="bg-[#0b0c0c] border-b-[10px] border-[#1d70b8]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white !no-underline hover:!underline">
            <Crown />
            <span className="text-xl font-bold tracking-tight text-white">
              Fantasy <span className="border-l-4 border-[#1d70b8] pl-2 ml-1">UK Cabinet</span>
            </span>
          </Link>
          <div className="text-sm text-white">
            {user ? (
              <span className="flex items-center gap-3">
                <span className="text-[#bfc1c3]">{user.displayName}</span>
                <form action={logoutAction}>
                  <button className="text-white !underline hover:text-[#fd0]">
                    Sign out
                  </button>
                </form>
              </span>
            ) : (
              <Link href="/login" className="text-white !underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Secondary nav */}
      <nav className="border-b border-[#b1b4b6] bg-white">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
          <Link href="/pick" className="!text-[#1d70b8]">Pick squad</Link>
          <Link href="/my-cabinet" className="!text-[#1d70b8]">My cabinet</Link>
          <Link href="/leaderboard" className="!text-[#1d70b8]">Leaderboard</Link>
          <Link href="/leagues" className="!text-[#1d70b8]">Leagues</Link>
          <Link href="/rules" className="!text-[#1d70b8]">Rules</Link>
          {admin && (
            <Link href="/admin" className="!text-[#d4351c]">Admin</Link>
          )}
        </div>
      </nav>
    </>
  );
}

function Crown() {
  return (
    <svg
      width="36"
      height="32"
      viewBox="0 0 132 97"
      aria-hidden
      fill="currentColor"
      className="text-white"
    >
      <path d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9zM4.4 57.2c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.5-1.5-7.6.3-9.1 3.8-1.4 3.5.3 7.6 3.9 9.1zm38.3-21.4c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.6-1.5-7.6.3-9.1 3.8-1.3 3.6.4 7.7 3.9 9.1zm64.4-5.6c-3.6 1.5-7.8-.2-9.1-3.7-1.5-3.6.2-7.8 3.8-9.2 3.6-1.4 7.7.3 9.2 3.9 1.3 3.5-.4 7.5-3.9 9zm15.9 8.8c-3.6 1.5-7.8-.2-9.2-3.7-1.5-3.6.2-7.8 3.9-9.1 3.6-1.5 7.7.2 9.1 3.8 1.5 3.5-.3 7.5-3.8 9zm4.7 17.7c-3.6 1.5-7.8-.2-9.2-3.8-1.5-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.1 3.8 1.5 3.6-.3 7.6-3.8 9.1zM89.3 35.8c-3.6 1.5-7.8-.2-9.2-3.8-1.4-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.3 3.6-.4 7.7-3.9 9.1zM69.7 17.7l8.9 4.7V9.3l-8.9 2.8c-.2-.3-.5-.6-.9-.9L72.4 0H59.6l3.5 11.2c-.3.3-.6.5-.9.9l-8.8-2.8v13.1l8.8-4.7c.3.3.6.7.9.9l-5 15.4v.1c-.2.8-.4 1.6-.4 2.4 0 4.1 3.1 7.5 7 8.1h.2c.3 0 .7.1 1 .1.4 0 .7 0 1-.1h.2c4-.6 7.1-4.1 7.1-8.1 0-.8-.1-1.7-.4-2.4V34l-5.1-15.4c.4-.2.7-.6 1-.9zM66 92.8c16.9 0 32.8 1.1 47.1 3.2 4-16.9 8.9-26.7 14-33.5l-9.1-4c-2.7 6.7-4.4 12-9.7 21l-3.1-3.5 4.4-7.5-12.3-9.7-3.5 4.5-15.5-15-7.4 9.4 1.6 1.5h-2c-.5 0-1 .1-1.5.1l-3.1-2.8-9.7 6.4 1.5 9.4 1.6 1.5-2 .8-4.7-2.1-7.4 9.4 9.5 6.4 1.6 1.5-3.6.8-2 8.9c4.3-2 9.5-3.5 16-4.5z" />
    </svg>
  );
}
