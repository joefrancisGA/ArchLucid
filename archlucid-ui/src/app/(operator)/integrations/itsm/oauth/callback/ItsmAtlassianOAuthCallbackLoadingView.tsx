import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import { cn } from "@/lib/utils";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_STATUS_LABEL,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** In-card loading chrome for Atlassian OAuth callback consent completion. */
export function ItsmAtlassianOAuthCallbackLoadingView(): React.JSX.Element {
  return (
    <div data-testid="itsm-oauth-callback-loading">
      <StatusTag
        kind="in-progress"
        label={ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_STATUS_LABEL}
        data-testid="itsm-oauth-callback-loading-status-tag"
      />

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
