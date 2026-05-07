import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { isPastDeadline } from "@/lib/dates";
import { SquadPicker } from "@/components/SquadPicker";
import knownRoles from "@/data/known-roles.json";

export default async function PickPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [mps, cabinet, settings, assignments] = await Promise.all([
    store.listMPs(),
    store.getCabinet(user.id),
    store.getSettings(),
    store.listRoleAssignments(),
  ]);

  const locked = settings.freezeAll || isPastDeadline(new Date(), settings.swapDeadline);

  // Build a map of current role for each MP (for filtering / display).
  const now = new Date();
  const currentRole = new Map<string, { titleLabel: string; roleType: string }>();
  for (const a of assignments) {
    const start = new Date(a.startDate).getTime();
    const end = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    if (start <= now.getTime() && now.getTime() < end) {
      const existing = currentRole.get(a.mpId);
      const order = ["pm", "great_office", "cabinet", "attending"];
      if (
        !existing ||
        order.indexOf(a.roleType) < order.indexOf(existing.roleType)
      ) {
        currentRole.set(a.mpId, { titleLabel: a.titleLabel, roleType: a.roleType });
      }
    }
  }

  const mpsWithRole = mps
    .filter((m) => m.active)
    .map((m) => ({
      ...m,
      currentRole: currentRole.get(m.id) ?? null,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <SquadPicker
        mps={mpsWithRole}
        knownRoles={knownRoles}
        initialPicks={cabinet?.picks ?? []}
        locked={locked}
      />
    </div>
  );
}
