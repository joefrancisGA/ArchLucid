import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AUTH_BOOTSTRAP_LOADING_DETAIL,
  AUTH_BOOTSTRAP_PAGE_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";
import { AUTH_BOOTSTRAP_CLAIM_DISCIPLINE } from "@/lib/auth-bootstrap-evidence-copy";
import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/auth/bootstrap` Suspense fallback and status fetch. */
export function PostAuthBootstrapLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="post-auth-bootstrap-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_BOOTSTRAP_PAGE_TITLE}</h1>

      <PageHeaderClaimDiscipline
        text={AUTH_BOOTSTRAP_CLAIM_DISCIPLINE}
        testId="post-auth-bootstrap-claim-discipline"
        className="mt-3 text-left"
      />

      <Skeleton
        className="mt-3 h-4 w-full max-w-md"
        data-testid="post-auth-bootstrap-loading-lead-skeleton"
      />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="post-auth-bootstrap-loading-skeleton-card"
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
        data-testid="post-auth-bootstrap-loading-status"
      >
        <p className="m-0">{AUTH_BOOTSTRAP_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
