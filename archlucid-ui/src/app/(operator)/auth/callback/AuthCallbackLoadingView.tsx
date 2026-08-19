import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AUTH_CALLBACK_LOADING_DETAIL,
  AUTH_CALLBACK_PAGE_TITLE,
  AUTH_CALLBACK_RESTART_SIGN_IN_ACTION,
  AUTH_CALLBACK_SLOW_HINT_PREFIX,
} from "@/lib/auth/auth-callback-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AuthCallbackLoadingViewProps = {
  readonly message?: string;
  readonly showSlowHint?: boolean;
};

/** Shared loading chrome for `/auth/callback` Suspense fallback and in-flight token exchange. */
export function AuthCallbackLoadingView({
  message = AUTH_CALLBACK_LOADING_DETAIL,
  showSlowHint = false,
}: AuthCallbackLoadingViewProps): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="auth-callback-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_CALLBACK_PAGE_TITLE}</h1>

      <Skeleton
        className="mt-3 h-4 w-full max-w-md"
        data-testid="auth-callback-loading-lead-skeleton"
      />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="auth-callback-loading-skeleton-card"
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-44" />
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn("mt-4", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}
        data-testid="auth-callback-loading-status"
      >
        <p className="m-0">{message}</p>

        {showSlowHint ? (
          <p className="m-0 mt-3">
            {AUTH_CALLBACK_SLOW_HINT_PREFIX}{" "}
            <Link className={OPERATOR_LINK.nav} href="/auth/signin" data-testid="auth-callback-restart-sign-in">
              {AUTH_CALLBACK_RESTART_SIGN_IN_ACTION}
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
