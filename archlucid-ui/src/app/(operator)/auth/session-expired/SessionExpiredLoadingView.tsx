import { cn } from "@/lib/utils";

import { SESSION_EXPIRED_LOADING_DETAIL } from "@/lib/auth/session-expired-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/session-expired` Suspense fallback (TB-1314). */
export function SessionExpiredLoadingView(): React.JSX.Element {
  return (
    <div data-testid="session-expired-loading" role="status" aria-live="polite" aria-busy="true">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Session expired</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SESSION_EXPIRED_LOADING_DETAIL}</p>
    </div>
  );
}
