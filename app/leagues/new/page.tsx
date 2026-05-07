import { createLeague } from "../actions";

export default async function NewLeaguePage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Create a league</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Pick a name. You&rsquo;ll get a 6-character join code to share.
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <form action={createLeague} className="space-y-3">
        <label className="block">
          <span className="text-sm">League name</span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoFocus
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>
        <button className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium">
          Create
        </button>
      </form>
    </div>
  );
}
