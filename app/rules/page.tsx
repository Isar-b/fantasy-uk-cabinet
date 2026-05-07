export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 prose prose-zinc dark:prose-invert">
      <h1>Rules</h1>

      <h2>The squad</h2>
      <ul>
        <li>Pick exactly <strong>10 Labour MPs</strong>.</li>
        <li>Total cost must be <strong>£100 or less</strong>.</li>
        <li>You can swap MPs in/out until <strong>20 June 2026</strong>.</li>
      </ul>

      <h2>Scoring</h2>
      <p>Final scores are based on the role each of your MPs holds on <strong>1 July 2026</strong>:</p>
      <ul>
        <li><strong>5 points</strong> if they&rsquo;re Prime Minister</li>
        <li><strong>3 points</strong> for a Great Office of State (Chancellor, Foreign, Home, Defence)</li>
        <li><strong>2 points</strong> for any other cabinet minister (Sec of State, Deputy PM, etc.)</li>
        <li><strong>1 point</strong> if they&rsquo;re &ldquo;attending cabinet&rdquo; without portfolio</li>
        <li><strong>0 points</strong> for a backbencher</li>
      </ul>

      <h2>Exact-role bonus</h2>
      <p>For each pick, you can <em>optionally</em> nominate the exact role you think they&rsquo;ll hold. If you&rsquo;re right on 1 July:</p>
      <ul>
        <li><strong>+3 bonus</strong> for predicting PM correctly</li>
        <li><strong>+2 bonus</strong> for the right Great Office</li>
        <li><strong>+1 bonus</strong> for the right cabinet portfolio</li>
        <li>No bonus for &ldquo;attending&rdquo; predictions (already a stretch to land)</li>
      </ul>
      <p>Wrong predictions never deduct points — predictions are pure upside.</p>

      <h2>Leagues</h2>
      <p>Create a private league and share the 6-character join code with friends. Everyone&rsquo;s on the global leaderboard too.</p>

      <h2>Live score</h2>
      <p>Until 1 July, the leaderboard shows your current score based on whoever&rsquo;s in cabinet right now. Reshuffles will move the standings around.</p>
    </div>
  );
}
