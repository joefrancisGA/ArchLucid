import { IMPACT_PREVIEW_BEFORE_AFTER_TITLE } from "@/lib/impact-preview-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SKELETON_BLOCK_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves before-and-after results layout while detail or simulation data reloads. */
export function ImpactPreviewResultsSkeleton(): React.JSX.Element {
  return (
    <section
      className="space-y-4"
      aria-labelledby="impact-preview-results-skeleton-heading"
      data-testid="impact-preview-results-skeleton"
      aria-busy="true"
    >
      <div>
        <h2 id="impact-preview-results-skeleton-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {IMPACT_PREVIEW_BEFORE_AFTER_TITLE}
        </h2>
        <div className={`mt-2 max-w-xl ${SKELETON_BLOCK_CLASS}`} />
      </div>
      <div className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
        <div className={SKELETON_BLOCK_CLASS} />
        <div className={SKELETON_BLOCK_CLASS} />
        <div className="h-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </section>
  );
}
