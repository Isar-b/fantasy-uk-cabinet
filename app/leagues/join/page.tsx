import { joinLeague } from "../actions";

export default async function JoinLeaguePage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Join a league</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Enter the 6-character code your friend shared.
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <form action={joinLeague} className="space-y-3">
        <input
          name="code"
          type="text"
          required
          minLength={4}
          maxLength={10}
          autoFocus
          autoCapitalize="characters"
          placeholder="ABC123"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono uppercase tracking-widest"
        />
        <button className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium">
          Join
        </button>
      </form>
    </div>
  );
}
