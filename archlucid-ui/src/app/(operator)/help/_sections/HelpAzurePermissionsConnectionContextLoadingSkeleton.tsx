import { Skeleton } from "@/components/ui/skeleton";
import { AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID } from "@/lib/azure-permissions-help-evidence-copy";

const CONNECTION_CONTEXT_VALUE_ROW_COUNT = 5;

/** Shell-standard placeholder while Azure connection query params hydrate (TB-1630). */
export function HelpAzurePermissionsConnectionContextLoadingSkeleton(): React.ReactElement {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div
        aria-busy="true"
        aria-label="Loading connection values"
        className="space-y-4"
        data-testid={AZURE_PERMISSIONS_HELP_CONNECTION_CONTEXT_LOADING_SKELETON_TEST_ID}
        role="status"
      >
        {Array.from({ length: CONNECTION_CONTEXT_VALUE_ROW_COUNT }, (_, index) => (
          <div key={index} className="space-y-1">
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
    </div>
  );
}
