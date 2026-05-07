import { computeLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await computeLeaderboard();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Global leaderboard</h1>
      {rows.length === 0 ? (
        <p className="text-zinc-500">No players yet — be the first to pick a squad.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="text-left py-2 w-10">#</th>
              <th className="text-left py-2">Player</th>
              <th className="text-right py-2">Points</th>
              <th className="text-right py-2 hidden sm:table-cell">Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {rows.map((r, i) => (
              <tr key={r.userId}>
                <td className="py-2 text-zinc-500 tabular-nums">{i + 1}</td>
                <td className="py-2 font-medium">{r.displayName}</td>
                <td className="py-2 text-right tabular-nums font-semibold">{r.totalPoints}</td>
                <td className="py-2 text-right tabular-nums hidden sm:table-cell text-zinc-500">
                  £{r.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-zinc-500 mt-4">
        Live score from current cabinet. Final score freezes 1 July 2026.
      </p>
    </div>
  );
}
