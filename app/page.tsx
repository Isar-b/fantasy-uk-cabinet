import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SCORING_DATE, SWAP_DEADLINE, timeUntil } from "@/lib/dates";

export default async function HomePage() {
  const user = await getCurrentUser();
  const swap = timeUntil(SWAP_DEADLINE);
  const score = timeUntil(SCORING_DATE);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#0b0c0c]">
        Fantasy UK Cabinet
      </h1>
      <p className="text-xl text-[#0b0c0c] mb-2 max-w-3xl">
        Pick 10 Labour MPs for £100. Score points if they&rsquo;re in cabinet on{" "}
        <strong>1 July 2026</strong>. Predict the exact role for bonus points.
      </p>

      <hr className="govuk-section-break govuk-section-break--l" style={{ borderBottom: "4px solid #1d70b8" }} />

      <section className="grid gap-6 sm:grid-cols-2 mb-10">
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
        <h2 className="text-2xl font-bold mb-4 govuk-heading-with-rule">
          How it scores
        </h2>
        <ul className="space-y-2 text-base">
          <li><strong>Prime Minister</strong>: 5 points (+3 if predicted exactly)</li>
          <li><strong>Great Office</strong> (Chancellor / Foreign / Home / Defence): 3 points (+2 exact)</li>
          <li><strong>Cabinet minister</strong> (Sec of State, Deputy PM, etc.): 2 points (+1 exact)</li>
          <li><strong>Attending cabinet</strong> without portfolio: 1 point</li>
          <li><em>Backbench / not in cabinet</em>: 0 points</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {user ? (
          <Link href="/pick" className="govuk-button !no-underline">
            Pick your squad
          </Link>
        ) : (
          <Link href="/login" className="govuk-button !no-underline">
            Sign in to play
          </Link>
        )}
        <Link href="/leaderboard" className="govuk-button govuk-button--secondary !no-underline !text-[#0b0c0c]">
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
    <div className="border-l-[10px] border-[#1d70b8] pl-4 py-1">
      <div className="text-sm uppercase tracking-wide text-[#505a5f] font-bold">
        {label}
      </div>
      <div className="text-3xl font-bold mt-1 text-[#0b0c0c]">
        {past ? "Passed" : `${d} days, ${h} hours`}
      </div>
      <div className="text-sm text-[#505a5f] mt-1">{target}</div>
    </div>
  );
}
