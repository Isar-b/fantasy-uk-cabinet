import { createLeague } from "../actions";

export default async function NewLeaguePage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-3 text-[#0b0c0c]">Create a league</h1>
      <p className="text-base mb-6">
        Pick a name. You&rsquo;ll get a 6-character join code to share.
      </p>
      {error && (
        <div className="border-l-[10px] border-[#d4351c] pl-4 py-3 mb-6">
          <p className="text-[#d4351c] font-bold">{error}</p>
        </div>
      )}
      <form action={createLeague} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-base font-bold text-[#0b0c0c] mb-1">
            League name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoFocus
            className="govuk-input max-w-md"
          />
        </div>
        <button className="govuk-button">Create</button>
      </form>
    </div>
  );
}
