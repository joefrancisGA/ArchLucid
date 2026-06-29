import { cn } from "@/lib/utils";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Bulleted preview of portfolio dashboard value when metrics are not yet populated. */
export function ExecutiveDashboardEmptyStatePreview(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <section
      aria-labelledby="executive-dashboard-empty-preview-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="executive-dashboard-empty-preview"
    >
      <h2 id="executive-dashboard-empty-preview-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
        {v.emptyStatePreviewSectionTitle}
      </h2>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {v.emptyStatePreviewBullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
