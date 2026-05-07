import { computeLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await computeLeaderboard();
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0b0c0c]">Global leaderboard</h1>
      {rows.length === 0 ? (
        <div className="govuk-inset-text">
          <p>No players yet — be the first to pick a squad.</p>
        </div>
      ) : (
        <table className="w-full text-base">
          <thead className="border-b-2 border-[#0b0c0c]">
            <tr>
              <th className="text-left py-2 w-12 font-bold">#</th>
              <th className="text-left py-2 font-bold">Player</th>
              <th className="text-right py-2 font-bold">Points</th>
              <th className="text-right py-2 hidden sm:table-cell font-bold">Spent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className="border-b border-[#b1b4b6]">
                <td className="py-3 text-[#505a5f] tabular-nums">{i + 1}</td>
                <td className="py-3 font-bold">{r.displayName}</td>
                <td className="py-3 text-right tabular-nums font-bold text-2xl">{r.totalPoints}</td>
                <td className="py-3 text-right tabular-nums hidden sm:table-cell text-[#505a5f]">
                  £{r.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-sm text-[#505a5f] mt-6">
        Live score from current cabinet. Final score freezes 1 July 2026.
      </p>
    </div>
  );
}
