import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { score } from "@/lib/scoring";

export default async function MyCabinetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [cabinet, mps, assignments] = await Promise.all([
    store.getCabinet(user.id),
    store.listMPs(),
    store.listRoleAssignments(),
  ]);

  if (!cabinet) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-3">My cabinet</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          You haven&rsquo;t picked a squad yet.
        </p>
        <Link href="/pick" className="px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium">
          Pick now →
        </Link>
      </div>
    );
  }

  const mpById = new Map(mps.map((m) => [m.id, m]));
  const result = score({ picks: cabinet.picks }, assignments, new Date());

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">My cabinet</h1>
        <Link href="/pick" className="text-sm underline">Edit squad</Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Live score" value={result.totalPoints.toString()} accent />
        <Stat label="Spent" value={`£${cabinet.totalCost.toFixed(2)}`} />
        <Stat label="Squad" value={`${cabinet.picks.length}/10`} />
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Score reflects current cabinet roles. Final score freezes on 1 July 2026.
      </p>

      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="text-left py-2">MP</th>
            <th className="text-left py-2">Current role</th>
            <th className="text-left py-2">Predicted</th>
            <th className="text-right py-2">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {result.perMP.map((p) => {
            const mp = mpById.get(p.mpId);
            const points = p.basePoints + p.bonusPoints;
            return (
              <tr key={p.mpId}>
                <td className="py-2">
                  <div className="font-medium">{mp?.name ?? p.mpId}</div>
                  <div className="text-xs text-zinc-500">{mp?.constituency}</div>
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {p.titleLabel ?? <span className="italic text-zinc-400">backbench</span>}
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {p.predictedRole ? (
                    <span className={p.predictionHit ? "text-emerald-600 font-medium" : ""}>
                      {p.predictedRole}
                      {p.predictionHit && " ✓"}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {p.basePoints}
                  {p.bonusPoints > 0 && (
                    <span className="text-emerald-600"> +{p.bonusPoints}</span>
                  )}
                  {points === 0 && <span className="text-zinc-400">0</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? "text-emerald-600" : ""}`}>{value}</div>
    </div>
  );
}
