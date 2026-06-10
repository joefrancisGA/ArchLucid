import { Skeleton } from "@/components/ui/skeleton";

/** Layout-stable skeleton for CTO demo step 1 — verdict and top risks above the fold. */
export default function ExecutiveReviewRunLoading(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading executive review" className="space-y-6" data-testid="executive-review-loading">
      <Skeleton className="h-8 w-56" />
      <section className="space-y-4 rounded-xl border border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:px-5">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4 max-w-md" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </section>
      <Skeleton className="h-40 w-full max-w-4xl rounded-lg" />
    </div>
  );
}
