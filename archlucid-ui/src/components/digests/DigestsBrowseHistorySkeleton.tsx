import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_ROWS: readonly number[] = [1, 2, 3, 4, 5];

/**
 * Loading chrome for the Browse tab (TB-1502).
 * Mirrors the populated `history table + detail panel` grid so the first paint
 * shows the shape of the surface instead of a single prose line.
 */
export function DigestsBrowseHistorySkeleton(): ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="Loading digest history"
      className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
      data-testid="digests-browse-skeleton"
      data-operator-side-rail-kind="master-detail"
      role="status"
    >
      <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-8 w-full" />
        {PLACEHOLDER_ROWS.map((row) => (
          <Skeleton key={row} className="mt-2 h-9 w-full" />
        ))}
      </section>

      <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-4 w-32" />
        <Skeleton className="mt-2 h-24 w-full" />
      </section>
    </div>
  );
}
