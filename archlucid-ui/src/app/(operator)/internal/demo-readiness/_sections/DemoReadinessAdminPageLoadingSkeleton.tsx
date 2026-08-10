import { Skeleton } from "@/components/ui/skeleton";

export function DemoReadinessAdminPageLoadingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6" data-testid="demo-readiness-admin-loading-skeleton" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
