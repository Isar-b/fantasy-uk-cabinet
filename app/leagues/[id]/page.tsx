import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { computeLeaderboard } from "@/lib/leaderboard";
import { leaveLeague } from "../actions";

export default async function LeaguePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await props.params;
  const { error } = await props.searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const league = await store.getLeague(id);
  if (!league) notFound();

  const isMember = league.memberIds.includes(user.id);
  if (!isMember) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-3">{league.name}</h1>
        <p className="text-sm mb-4">
          You aren&rsquo;t a member of this league. Ask the owner for the join
          code.
        </p>
        <Link href="/leagues" className="text-sm underline">
          ← Back to leagues
        </Link>
      </div>
    );
  }

  const rows = await computeLeaderboard(league.memberIds);
  const isOwner = league.ownerId === user.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <span className="text-xs text-zinc-500">
          Code <span className="font-mono">{league.joinCode}</span>
        </span>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        {league.memberIds.length} member{league.memberIds.length === 1 ? "" : "s"}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="text-left py-2 w-10">#</th>
            <th className="text-left py-2">Player</th>
            <th className="text-right py-2">Points</th>
            <th className="text-right py-2 hidden sm:table-cell">Squad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.map((r, i) => (
            <tr key={r.userId} className={r.userId === user.id ? "bg-amber-50/50 dark:bg-amber-950/30" : ""}>
              <td className="py-2 text-zinc-500 tabular-nums">{i + 1}</td>
              <td className="py-2 font-medium">
                {r.displayName}
                {r.userId === league.ownerId && <span className="ml-2 text-xs text-amber-600">owner</span>}
              </td>
              <td className="py-2 text-right tabular-nums font-semibold">{r.totalPoints}</td>
              <td className="py-2 text-right tabular-nums hidden sm:table-cell text-zinc-500">
                {r.pickedCount}/10
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!isOwner && (
        <form action={leaveLeague} className="mt-8">
          <input type="hidden" name="leagueId" value={league.id} />
          <button className="text-xs text-zinc-500 hover:text-red-600 underline">
            Leave league
          </button>
        </form>
      )}
    </div>
  );
}
