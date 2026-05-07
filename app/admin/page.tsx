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
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold mb-3 text-[#0b0c0c]">Admin</h1>
        <div className="govuk-inset-text">
          <p>You are not an admin.</p>
        </div>
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
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-10">
      <h1 className="text-3xl font-bold text-[#0b0c0c]">Admin</h1>

      <section>
        <h2 className="text-2xl font-bold mb-4 govuk-heading-with-rule">Settings</h2>
        <form action={setFreezeAction} className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 text-base">
            <input type="checkbox" name="freeze" defaultChecked={settings.freezeAll} />
            Freeze all squads (lock picker now)
          </label>
          <button className="govuk-button govuk-button--secondary !text-[#0b0c0c]">Save</button>
        </form>
        <p className="text-sm text-[#505a5f]">
          Deadline: {settings.swapDeadline} · Scoring: {settings.scoringDate}
        </p>

        <details className="mt-4">
          <summary className="text-base">Seed store from bundled JSON</summary>
          <form action={seedFromJsonAction} className="mt-3 flex items-start gap-3">
            <button className="govuk-button govuk-button--warning">Run seed</button>
            <p className="text-sm text-[#505a5f] max-w-md">
              Loads <code>data/mps.seed.json</code> and{" "}
              <code>data/role-assignments.seed.json</code> into the store.
              Overwrites MPs and replaces all role assignments. Safe to re-run after a roster refresh.
            </p>
          </form>
        </details>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 govuk-heading-with-rule">
          Active role assignments ({activeAssignments.length})
        </h2>
        <ul className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
          {activeAssignments.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[#505a5f]">No active assignments.</li>
          ) : (
            activeAssignments.map((a) => {
              const mp = mps.find((m) => m.id === a.mpId);
              return (
                <li
                  key={`${a.mpId}-${a.titleLabel}`}
                  className="px-4 py-3 flex items-center justify-between gap-4 text-base"
                >
                  <div className="min-w-0">
                    <span className="font-bold">{mp?.name ?? a.mpId}</span>
                    <span className="text-[#505a5f]"> · {a.titleLabel}</span>
                    <span className="ml-2 govuk-tag bg-[#0b0c0c] text-white text-[10px]">
                      {a.roleType}
                    </span>
                  </div>
                  <form action={endRoleAction} className="flex items-center gap-2 shrink-0">
                    <input type="hidden" name="mpId" value={a.mpId} />
                    <input type="hidden" name="titleLabel" value={a.titleLabel} />
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={today}
                      className="govuk-input text-sm w-auto"
                    />
                    <button className="govuk-button govuk-button--warning text-sm">End</button>
                  </form>
                </li>
              );
            })
          )}
        </ul>

        <details className="mt-4">
          <summary className="text-base">Add new role assignment</summary>
          <form
            action={addRoleAction}
            className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_180px_auto] gap-3 items-end"
          >
            <div>
              <label htmlFor="ar-mp" className="block text-sm font-bold mb-1">MP</label>
              <select id="ar-mp" name="mpId" required className="govuk-select text-sm">
                <option value="">— select —</option>
                {mps.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.constituency})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ar-role" className="block text-sm font-bold mb-1">Role</label>
              <select id="ar-role" name="titleLabel" required className="govuk-select text-sm">
                <option value="">— select —</option>
                {knownRoles.map((r) => (
                  <option key={r.titleLabel} value={r.titleLabel}>{r.titleLabel}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ar-date" className="block text-sm font-bold mb-1">Start date</label>
              <input id="ar-date" type="date" name="startDate" defaultValue={today} required className="govuk-input text-sm" />
            </div>
            <button className="govuk-button">Assign</button>
          </form>
          <p className="text-sm text-[#505a5f] mt-2">
            Adding a role auto-ends any existing holder of the same role.
          </p>
        </details>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 govuk-heading-with-rule">
          MPs ({mps.length})
        </h2>
        <form className="mb-4">
          <label htmlFor="mp-q" className="block text-sm font-bold mb-1">Search</label>
          <input
            id="mp-q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Name or constituency"
            className="govuk-input max-w-md text-sm"
          />
        </form>
        <div className="border border-[#b1b4b6] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f2f1] border-b-2 border-[#0b0c0c]">
              <tr>
                <th className="text-left py-2 px-3 font-bold">Name</th>
                <th className="text-left py-2 px-3 font-bold">Constituency</th>
                <th className="text-left py-2 px-3 font-bold w-20">Tier</th>
                <th className="text-left py-2 px-3 font-bold w-24">Price</th>
                <th className="text-left py-2 px-3 font-bold w-20">Active</th>
                <th className="py-2 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMPs.slice(0, 100).map((m) => (
                <tr key={m.id} className="border-b border-[#b1b4b6]">
                  <td className="py-1.5 px-3 font-bold">{m.name}</td>
                  <td className="py-1.5 px-3 text-[#505a5f]">{m.constituency}</td>
                  <td className="py-1.5 px-3">
                    <form action={updateMPAction} id={`mp-${m.id}`} className="contents" />
                    <input form={`mp-${m.id}`} type="hidden" name="id" value={m.id} />
                    <select form={`mp-${m.id}`} name="tier" defaultValue={m.tier} className="govuk-select text-sm w-auto">
                      {["S","A","B","C","D","E"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 px-3">
                    <input form={`mp-${m.id}`} name="price" defaultValue={m.price.toFixed(2)} type="number" step="0.5" min="0" max="50" className="govuk-input text-sm w-24" />
                  </td>
                  <td className="py-1.5 px-3">
                    <input form={`mp-${m.id}`} type="checkbox" name="active" defaultChecked={m.active} />
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <button form={`mp-${m.id}`} className="govuk-button govuk-button--secondary !text-[#0b0c0c] text-sm">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMPs.length > 100 && (
          <p className="text-sm text-[#505a5f] mt-2">
            Showing first 100 of {filteredMPs.length}. Refine the search to find more.
          </p>
        )}
      </section>
    </div>
  );
}
