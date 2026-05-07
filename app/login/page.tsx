import { loginAction, signInWithGoogle } from "./actions";
import { oauthEnabled } from "@/auth";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        {oauthEnabled
          ? "Sign in with Google to pick your squad."
          : "Phase 1 mock login — pick a display name."}
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {oauthEnabled ? (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.908c1.702-1.567 2.685-3.874 2.685-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      ) : (
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
      )}

      {!oauthEnabled && (
        <p className="mt-6 text-xs text-zinc-500">
          Sign in as <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">admin</code> for the admin panel.
        </p>
      )}
    </div>
  );
}
