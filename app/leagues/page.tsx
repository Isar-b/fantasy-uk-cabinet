import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function LeaguesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const leagues = await store.listLeaguesForUser(user.id);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0b0c0c]">Your leagues</h1>
        <div className="flex gap-2">
          <Link href="/leagues/join" className="govuk-button govuk-button--secondary !no-underline !text-[#0b0c0c]">
            Join
          </Link>
          <Link href="/leagues/new" className="govuk-button !no-underline">
            Create
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <div className="govuk-inset-text">
          <p>You&rsquo;re not in any leagues yet. Create one or join with a code.</p>
        </div>
      ) : (
        <ul className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
          {leagues.map((l) => (
            <li key={l.id} className="px-4 py-3">
              <Link href={`/leagues/${l.id}`}>
                <div className="font-bold text-lg">{l.name}</div>
              </Link>
              <div className="text-sm text-[#505a5f] mt-1">
                {l.memberIds.length} member{l.memberIds.length === 1 ? "" : "s"} · code{" "}
                <span className="font-mono font-bold">{l.joinCode}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
