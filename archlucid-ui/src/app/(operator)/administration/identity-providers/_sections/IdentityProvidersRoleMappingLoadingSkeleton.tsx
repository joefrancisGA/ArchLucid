import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING } from "@/lib/identity-providers-settings-copy";
import { cn } from "@/lib/utils";

/** Loading placeholder while role-mapping diagnostics hydrate (ADO). */
export function IdentityProvidersRoleMappingLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="identity-providers-role-mapping-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING}
      </p>
      <div className="h-9 w-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
