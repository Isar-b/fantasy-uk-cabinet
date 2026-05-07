export default function RulesPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-[#0b0c0c]">Rules</h1>

      <h2 className="text-2xl font-bold mb-3 govuk-heading-with-rule">The squad</h2>
      <ul className="space-y-2 mb-8">
        <li>Pick exactly <strong>10 Labour MPs</strong>.</li>
        <li>Total cost must be <strong>£100 or less</strong>.</li>
        <li>You can swap MPs in and out until <strong>20 June 2026</strong>.</li>
      </ul>

      <h2 className="text-2xl font-bold mb-3 govuk-heading-with-rule">Scoring</h2>
      <p className="mb-3">
        Final scores are based on the role each of your MPs holds on{" "}
        <strong>1 July 2026</strong>:
      </p>
      <ul className="space-y-2 mb-8">
        <li><strong>5 points</strong> if they&rsquo;re Prime Minister</li>
        <li><strong>3 points</strong> for a Great Office of State (Chancellor, Foreign, Home, Defence)</li>
        <li><strong>2 points</strong> for any other cabinet minister (Sec of State, Deputy PM, etc.)</li>
        <li><strong>1 point</strong> if they&rsquo;re &ldquo;attending cabinet&rdquo; without portfolio</li>
        <li><strong>0 points</strong> for a backbencher</li>
      </ul>

      <h2 className="text-2xl font-bold mb-3 govuk-heading-with-rule">
        Exact-role bonus
      </h2>
      <p className="mb-3">
        For each pick you can <em>optionally</em> nominate the exact role you
        think they&rsquo;ll hold. If you&rsquo;re right on 1 July:
      </p>
      <ul className="space-y-2 mb-3">
        <li><strong>+3 bonus</strong> for predicting PM correctly</li>
        <li><strong>+2 bonus</strong> for the right Great Office</li>
        <li><strong>+1 bonus</strong> for the right cabinet portfolio</li>
        <li>No bonus for &ldquo;attending&rdquo; predictions (already a stretch to land)</li>
      </ul>
      <p className="mb-8">Wrong predictions never deduct points — predictions are pure upside.</p>

      <h2 className="text-2xl font-bold mb-3 govuk-heading-with-rule">Leagues</h2>
      <p className="mb-8">
        Create a private league and share the 6-character join code with friends. Everyone&rsquo;s on the global leaderboard too.
      </p>

      <h2 className="text-2xl font-bold mb-3 govuk-heading-with-rule">Live score</h2>
      <p>
        Until 1 July, the leaderboard shows your current score based on
        whoever&rsquo;s in cabinet right now. Reshuffles will move the standings around.
      </p>
    </div>
  );
}
