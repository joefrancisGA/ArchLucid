import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  SCIM_PROVISIONING_LOADING_DETAIL,
  SCIM_PROVISIONING_PAGE_TITLE,
} from "@/lib/scim-provisioning-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Shared loading chrome for `/administration/scim-provisioning` Suspense fallback. */
export function ScimProvisioningLoadingView(): React.JSX.Element {
  return (
    <div className="max-w-[960px]" data-testid="scim-provisioning-loading">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SCIM_PROVISIONING_PAGE_TITLE}</h1>

      <Skeleton className="mt-3 h-4 w-full max-w-md" data-testid="scim-provisioning-loading-lead-skeleton" />

      <div
        className="mt-6 space-y-4 rounded-md border border-al-border p-4"
        data-testid="scim-provisioning-loading-skeleton-card"
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
        data-testid="scim-provisioning-loading-detail"
      >
        <p className="m-0">{SCIM_PROVISIONING_LOADING_DETAIL}</p>
      </div>
    </div>
  );
}
