import { Skeleton } from "@/components/ui/skeleton";

const KPI_PLACEHOLDERS: readonly number[] = [1, 2, 3, 4];

/**
 * Structured loading chrome for the sponsor dashboard first viewport (TB-1532).
 * Mirrors header actions, time-range control, and primary KPI grid shape.
 */
export function SponsorDashboardLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      aria-busy="true"
      aria-label="Loading sponsor dashboard"
      className="space-y-4"
      data-testid="sponsor-dashboard-loading-skeleton"
      role="status"
    >
      <span className="sr-only">Loading sponsor dashboard…</span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-44" data-testid="sponsor-dashboard-loading-time-range" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {KPI_PLACEHOLDERS.map((placeholder) => (
          <div
            key={placeholder}
            className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-full max-w-xs" />
          </div>
        ))}
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      </div>
    </div>
  );
}
