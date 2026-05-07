import { joinLeague } from "../actions";

export default async function JoinLeaguePage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-3 text-[#0b0c0c]">Join a league</h1>
      <p className="text-base mb-6">
        Enter the 6-character code your friend shared.
      </p>
      {error && (
        <div className="border-l-[10px] border-[#d4351c] pl-4 py-3 mb-6">
          <p className="text-[#d4351c] font-bold">{error}</p>
        </div>
      )}
      <form action={joinLeague} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-base font-bold text-[#0b0c0c] mb-1">
            Join code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            minLength={4}
            maxLength={10}
            autoFocus
            autoCapitalize="characters"
            placeholder="ABC123"
            className="govuk-input max-w-xs font-mono uppercase tracking-widest"
          />
        </div>
        <button className="govuk-button">Join</button>
      </form>
    </div>
  );
}
