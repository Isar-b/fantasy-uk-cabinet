import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import knownRoles from "@/data/known-roles.json";
import { addRoleAction, endRoleAction, seedFromJsonAction, setFreezeAction, updateMPAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-3">Admin</h1>
        <p className="text-sm text-zinc-500">
          You are not an admin. Sign in as <code>admin</code> (Phase 1) or with
          an allowlisted email (Phase 2).
        </p>
      </div>
    );
  }

  const { q } = await props.searchParams;
  const [mps, assignments, settings] = await Promise.all([
    store.listMPs(),
    store.listRoleAssignments(),
    store.getSettings(),
  ]);

  const filteredMPs = q
    ? mps.filter(
        (m) =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.constituency.toLowerCase().includes(q.toLowerCase())
      )
    : mps;

  const activeAssignments = assignments.filter((a) => !a.endDate);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold">Admin</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Settings</h2>
        <form action={setFreezeAction} className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="freeze" defaultChecked={settings.freezeAll} />
            Freeze all squads (lock picker now)
          </label>
          <button className="px-3 py-1.5 rounded-md text-sm border border-zinc-300 dark:border-zinc-700">
            Save
          </button>
        </form>
        <p className="text-xs text-zinc-500 mt-1">
          Deadline: {settings.swapDeadline} · Scoring: {settings.scoringDate}
        </p>

        <details className="mt-4">
          <summary className="text-sm cursor-pointer">Seed store from bundled JSON</summary>
          <form action={seedFromJsonAction} className="mt-2 flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-md text-sm bg-amber-600 text-white">
              Run seed
            </button>
            <p className="text-xs text-zinc-500">
              Loads <code>data/mps.seed.json</code> and <code>data/role-assignments.seed.json</code> into the store. Overwrites MPs and replaces all role assignments. Safe to re-run after a roster refresh.
            </p>
          </form>
        </details>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Active role assignments ({activeAssignments.length})
        </h2>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {activeAssignments.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">No active assignments.</li>
          ) : (
            activeAssignments.map((a) => {
              const mp = mps.find((m) => m.id === a.mpId);
              return (
                <li key={`${a.mpId}-${a.titleLabel}`} className="px-4 py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{mp?.name ?? a.mpId}</span>
                    <span className="text-zinc-500"> · {a.titleLabel}</span>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {a.roleType}
                    </span>
                  </div>
                  <form action={endRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="mpId" value={a.mpId} />
                    <input type="hidden" name="titleLabel" value={a.titleLabel} />
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={today}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                    />
                    <button className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950">
                      End
                    </button>
                  </form>
                </li>
              );
            })
          )}
        </ul>

        <details className="mt-4">
          <summary className="text-sm cursor-pointer">Add new role assignment</summary>
          <form action={addRoleAction} className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_140px_auto] gap-2 items-center">
            <select name="mpId" required className="text-sm px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <option value="">— MP —</option>
              {mps.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.constituency})</option>
              ))}
            </select>
            <select name="titleLabel" required className="text-sm px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <option value="">— role —</option>
              {knownRoles.map((r) => (
                <option key={r.titleLabel} value={r.titleLabel}>{r.titleLabel}</option>
              ))}
            </select>
            <input
              type="date"
              name="startDate"
              defaultValue={today}
              required
              className="text-sm px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
            <button className="text-sm px-3 py-1 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              Assign
            </button>
          </form>
          <p className="text-xs text-zinc-500 mt-2">
            Adding a role auto-ends any existing holder of the same role.
          </p>
        </details>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">MPs ({mps.length})</h2>
        <form className="mb-3">
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Search…"
            className="w-full max-w-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          />
        </form>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Constituency</th>
                <th className="text-left py-2 px-3 w-20">Tier</th>
                <th className="text-left py-2 px-3 w-24">Price</th>
                <th className="text-left py-2 px-3 w-20">Active</th>
                <th className="py-2 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {filteredMPs.slice(0, 100).map((m) => (
                <tr key={m.id}>
                  <td className="py-1.5 px-3 font-medium">{m.name}</td>
                  <td className="py-1.5 px-3 text-zinc-500">{m.constituency}</td>
                  <td className="py-1.5 px-3">
                    <form action={updateMPAction} id={`mp-${m.id}`} className="contents" />
                    <input form={`mp-${m.id}`} type="hidden" name="id" value={m.id} />
                    <select form={`mp-${m.id}`} name="tier" defaultValue={m.tier}
                      className="text-xs px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                      {["S","A","B","C","D","E"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-3">
                    <input form={`mp-${m.id}`} name="price" defaultValue={m.price.toFixed(2)} type="number" step="0.5" min="0" max="50"
                      className="w-20 text-xs px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
                  </td>
                  <td className="py-1.5 px-3">
                    <input form={`mp-${m.id}`} type="checkbox" name="active" defaultChecked={m.active} />
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <button form={`mp-${m.id}`} className="text-xs px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMPs.length > 100 && (
          <p className="text-xs text-zinc-500 mt-2">
            Showing first 100 of {filteredMPs.length}. Refine the search to find more.
          </p>
        )}
      </section>
    </div>
  );
}
