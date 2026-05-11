import { Suspense } from "react";

import { CallbackClient } from "@/app/(operator)/auth/callback/CallbackClient";

function AuthCallbackLoading() {
  return (
    <div className="max-w-[560px]">
      <h2 className="mt-0 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Completing sign-in</h2>

      <p role="status" aria-live="polite" className="m-0 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        Preparing secure session…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <CallbackClient />
    </Suspense>
  );
}
