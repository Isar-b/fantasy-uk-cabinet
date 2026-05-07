import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function LeaguesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const leagues = await store.listLeaguesForUser(user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-2xl font-bold">Your leagues</h1>
        <div className="flex gap-2">
          <Link href="/leagues/join" className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700">
            Join
          </Link>
          <Link href="/leagues/new" className="text-sm px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            Create
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <p className="text-zinc-500">
          You&rsquo;re not in any leagues yet. Create one or join with a code.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {leagues.map((l) => (
            <li key={l.id} className="px-4 py-3 flex items-center justify-between">
              <Link href={`/leagues/${l.id}`} className="hover:underline">
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-zinc-500">
                  {l.memberIds.length} member{l.memberIds.length === 1 ? "" : "s"} ·
                  code <span className="font-mono">{l.joinCode}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
