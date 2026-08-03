import { Skeleton } from "@/components/ui/skeleton";

/**
 * Inbox-list-only skeleton for nested Suspense under alerts hub chrome (TB-2026).
 * Omits page title — chrome already painted outside the boundary.
 */
export function AlertsInboxPanelSkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading alert inbox" className="space-y-3" data-testid="alerts-inbox-panel-skeleton">
      <Skeleton className="h-10 w-28" />
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        >
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </div>
      ))}
    </div>
  );
}
