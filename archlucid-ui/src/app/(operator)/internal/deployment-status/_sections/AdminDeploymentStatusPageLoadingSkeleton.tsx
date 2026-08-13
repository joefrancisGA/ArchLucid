import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export function AdminDeploymentStatusPageLoadingSkeleton(): React.ReactElement {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-deployment-status-loading-skeleton" aria-busy="true">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
