import { loginAction } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Phase 1 mock login — just pick a display name. Google sign-in arrives in
        Phase 2.
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <form action={loginAction} className="space-y-3">
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Display name
          </span>
          <input
            type="text"
            name="displayName"
            required
            maxLength={32}
            autoFocus
            placeholder="alice"
            className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm"
        >
          Sign in
        </button>
      </form>
      <p className="mt-6 text-xs text-zinc-500">
        Sign in as <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">admin</code> for the admin panel.
      </p>
    </div>
  );
}
