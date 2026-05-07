import { loginAction, signInWithGoogle } from "./actions";
import { oauthEnabled } from "@/auth";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-3 text-[#0b0c0c]">Sign in</h1>
      <p className="text-base text-[#0b0c0c] mb-6">
        {oauthEnabled
          ? "Sign in with Google to pick your squad."
          : "Phase 1 mock login — pick a display name."}
      </p>
      {error && (
        <div className="border-l-[10px] border-[#d4351c] pl-4 py-3 mb-6 bg-white">
          <p className="text-[#d4351c] font-bold">{error}</p>
        </div>
      )}

      {oauthEnabled ? (
        <form action={signInWithGoogle}>
          <button type="submit" className="govuk-button">
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.908c1.702-1.567 2.685-3.874 2.685-6.615z" />
                <path fill="#fff" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z" />
                <path fill="#fff" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#fff" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </span>
          </button>
        </form>
      ) : (
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-base font-bold text-[#0b0c0c] mb-1">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              required
              maxLength={32}
              autoFocus
              placeholder="alice"
              className="govuk-input max-w-sm"
            />
          </div>
          <button type="submit" className="govuk-button">
            Sign in
          </button>
        </form>
      )}

      {!oauthEnabled && (
        <p className="mt-6 text-sm text-[#505a5f]">
          Sign in as <code className="px-1 bg-[#f3f2f1]">admin</code> for the admin panel.
        </p>
      )}
    </div>
  );
}
