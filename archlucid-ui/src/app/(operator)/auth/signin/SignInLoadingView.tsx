import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AUTH_SIGNIN_LOADING_DETAIL } from "@/lib/auth/auth-signin-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/signin` Suspense fallback (TB-1314 parity). */
export function SignInLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="auth-signin-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Sign in</h1>

      <Skeleton className="mt-3 h-4 w-full max-w-md" data-testid="auth-signin-loading-lead-skeleton" />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="auth-signin-loading-skeleton-card"
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-44" />
      </div>

      <div
        role="status"
        className={cn("mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="auth-signin-loading-detail"
      >
        {AUTH_SIGNIN_LOADING_DETAIL}
      </div>
    </div>
  );
}
