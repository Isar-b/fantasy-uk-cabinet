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
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold mb-4 text-[#0b0c0c]">{league.name}</h1>
        <p className="text-base mb-4">
          You aren&rsquo;t a member of this league. Ask the owner for the join code.
        </p>
        <Link href="/leagues">← Back to leagues</Link>
      </div>
    );
  }

  const rows = await computeLeaderboard(league.memberIds);
  const isOwner = league.ownerId === user.id;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-bold text-[#0b0c0c]">{league.name}</h1>
        <span className="text-sm text-[#505a5f]">
          Code <span className="font-mono font-bold">{league.joinCode}</span>
        </span>
      </div>
      <p className="text-sm text-[#505a5f] mb-6">
        {league.memberIds.length} member{league.memberIds.length === 1 ? "" : "s"}
      </p>

      {error && (
        <div className="border-l-[10px] border-[#d4351c] pl-4 py-3 mb-6">
          <p className="text-[#d4351c] font-bold">{error}</p>
        </div>
      )}

      <table className="w-full text-base">
        <thead className="border-b-2 border-[#0b0c0c]">
          <tr>
            <th className="text-left py-2 w-12 font-bold">#</th>
            <th className="text-left py-2 font-bold">Player</th>
            <th className="text-right py-2 font-bold">Points</th>
            <th className="text-right py-2 hidden sm:table-cell font-bold">Squad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.userId}
              className={`border-b border-[#b1b4b6] ${r.userId === user.id ? "bg-[#fff7bf]" : ""}`}
            >
              <td className="py-3 text-[#505a5f] tabular-nums">{i + 1}</td>
              <td className="py-3 font-bold">
                {r.displayName}
                {r.userId === league.ownerId && (
                  <span className="ml-2 govuk-tag bg-[#1d70b8] text-white">Owner</span>
                )}
              </td>
              <td className="py-3 text-right tabular-nums font-bold text-2xl">{r.totalPoints}</td>
              <td className="py-3 text-right tabular-nums hidden sm:table-cell text-[#505a5f]">
                {r.pickedCount}/10
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!isOwner && (
        <form action={leaveLeague} className="mt-8">
          <input type="hidden" name="leagueId" value={league.id} />
          <button className="govuk-button govuk-button--warning">
            Leave league
          </button>
        </form>
      )}
    </div>
  );
}
