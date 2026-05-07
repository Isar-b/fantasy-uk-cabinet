import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SCORING_DATE, SWAP_DEADLINE, timeUntil } from "@/lib/dates";

export default async function HomePage() {
  const user = await getCurrentUser();
  const swap = timeUntil(SWAP_DEADLINE);
  const score = timeUntil(SCORING_DATE);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
        Fantasy UK Cabinet
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        Pick 10 Labour MPs for £100. Score points if they&rsquo;re in cabinet on{" "}
        <strong>1 July 2026</strong>. Predict the exact role for bonus points.
      </p>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <CountdownCard
          label="Squad lock"
          target="20 June 2026"
          d={swap.days}
          h={swap.hours}
          past={swap.past}
        />
        <CountdownCard
          label="Final scoring"
          target="1 July 2026"
          d={score.days}
          h={score.hours}
          past={score.past}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">How it scores</h2>
        <ul className="space-y-2 text-sm">
          <li>🏆 <strong>Prime Minister</strong>: 5 points (+3 if predicted exactly)</li>
          <li>🥇 <strong>Great Office</strong> (Chancellor / Foreign / Home / Defence): 3 points (+2 exact)</li>
          <li>🪑 <strong>Cabinet minister</strong> (Sec of State, Deputy PM, etc.): 2 points (+1 exact)</li>
          <li>📎 <strong>Attending cabinet</strong> without portfolio: 1 point</li>
          <li>🪑 <em>Backbench / not in cabinet</em>: 0</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {user ? (
          <Link
            href="/pick"
            className="px-5 py-3 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium"
          >
            Pick your squad →
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-5 py-3 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium"
          >
            Sign in to play
          </Link>
        )}
        <Link
          href="/leaderboard"
          className="px-5 py-3 rounded-md border border-zinc-300 dark:border-zinc-700 font-medium"
        >
          See leaderboard
        </Link>
      </div>
    </div>
  );
}

function CountdownCard({
  label,
  target,
  d,
  h,
  past,
}: {
  label: string;
  target: string;
  d: number;
  h: number;
  past: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {past ? "Passed" : `${d}d ${h}h`}
      </div>
      <div className="text-xs text-zinc-500 mt-1">{target}</div>
    </div>
  );
}
