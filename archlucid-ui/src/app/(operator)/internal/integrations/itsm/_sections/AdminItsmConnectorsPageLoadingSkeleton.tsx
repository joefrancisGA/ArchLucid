import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export function AdminItsmConnectorsPageLoadingSkeleton(): React.ReactElement {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-itsm-connectors-loading-skeleton" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
