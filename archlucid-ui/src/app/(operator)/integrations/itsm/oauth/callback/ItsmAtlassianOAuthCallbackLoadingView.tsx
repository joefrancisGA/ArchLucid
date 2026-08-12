import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_STATUS_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for Atlassian OAuth callback Suspense fallback and in-flight consent completion. */
export function ItsmAtlassianOAuthCallbackLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[560px]" data-testid="itsm-oauth-callback-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE}</h1>

      <div className="mt-3">
        <StatusTag
          kind="in-progress"
          label={ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_STATUS_LABEL}
          data-testid="itsm-oauth-callback-loading-status-tag"
        />
      </div>

      <Skeleton
        className="mt-4 h-4 w-full max-w-md"
        data-testid="itsm-oauth-callback-loading-lead-skeleton"
      />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="itsm-oauth-callback-loading-skeleton-card"
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
        data-testid="itsm-oauth-callback-loading-status"
      >
        <p className="m-0">{ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
