import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { CallbackClient } from "@/app/(operator)/auth/callback/CallbackClient";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function AuthCallbackLoading() {
  return (
    <div className="max-w-[560px]">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Completing sign-in</h2>

      <p role="status" aria-live="polite" className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
