import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AUTH_INVITE_LOADING_DETAIL,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/invite` Suspense fallback and token validation. */
export function InvitationAcceptLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="invitation-accept-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_INVITE_PAGE_TITLE}</h1>

      <Skeleton
        className="mt-3 h-4 w-full max-w-md"
        data-testid="invitation-accept-loading-lead-skeleton"
      />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="invitation-accept-loading-skeleton-card"
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
        data-testid="invitation-accept-loading-status"
      >
        <p className="m-0">{AUTH_INVITE_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
