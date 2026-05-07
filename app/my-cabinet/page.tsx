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
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold mb-4 text-[#0b0c0c]">My cabinet</h1>
        <p className="text-base mb-6">You haven&rsquo;t picked a squad yet.</p>
        <Link href="/pick" className="govuk-button !no-underline">Pick now</Link>
      </div>
    );
  }

  const mpById = new Map(mps.map((m) => [m.id, m]));
  const result = score({ picks: cabinet.picks }, assignments, new Date());

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-bold text-[#0b0c0c]">My cabinet</h1>
        <Link href="/pick">Edit squad</Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Live score" value={result.totalPoints.toString()} accent />
        <Stat label="Spent" value={`£${cabinet.totalCost.toFixed(2)}`} />
        <Stat label="Squad" value={`${cabinet.picks.length}/10`} />
      </div>

      <p className="text-sm text-[#505a5f] mb-6">
        Score reflects current cabinet roles. Final score freezes on 1 July 2026.
      </p>

      <table className="w-full text-base">
        <thead className="border-b-2 border-[#0b0c0c]">
          <tr>
            <th className="text-left py-2 font-bold">MP</th>
            <th className="text-left py-2 font-bold">Current role</th>
            <th className="text-left py-2 font-bold">Predicted</th>
            <th className="text-right py-2 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {result.perMP.map((p) => {
            const mp = mpById.get(p.mpId);
            const points = p.basePoints + p.bonusPoints;
            return (
              <tr key={p.mpId} className="border-b border-[#b1b4b6]">
                <td className="py-3">
                  <div className="font-bold">{mp?.name ?? p.mpId}</div>
                  <div className="text-sm text-[#505a5f]">{mp?.constituency}</div>
                </td>
                <td className="py-3 text-[#0b0c0c]">
                  {p.titleLabel ?? <span className="italic text-[#505a5f]">backbench</span>}
                </td>
                <td className="py-3">
                  {p.predictedRole ? (
                    <span className={p.predictionHit ? "text-[#00703c] font-bold" : ""}>
                      {p.predictedRole}
                      {p.predictionHit && " ✓"}
                    </span>
                  ) : (
                    <span className="text-[#505a5f]">—</span>
                  )}
                </td>
                <td className="py-3 text-right tabular-nums font-bold">
                  {p.basePoints}
                  {p.bonusPoints > 0 && (
                    <span className="text-[#00703c]"> +{p.bonusPoints}</span>
                  )}
                  {points === 0 && <span className="text-[#505a5f]">0</span>}
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
    <div className="border-l-[10px] border-[#1d70b8] pl-4 py-1">
      <div className="text-sm uppercase tracking-wide text-[#505a5f] font-bold">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${accent ? "text-[#00703c]" : "text-[#0b0c0c]"}`}>{value}</div>
    </div>
  );
}
