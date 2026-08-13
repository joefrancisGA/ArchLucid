import { cn } from "@/lib/utils";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Bulleted preview of scorecard value when metrics are not yet populated. */
export function ExecutiveScorecardEmptyStatePreview(props: { readonly embedded?: boolean } = {}): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const list = (
    <ul className={cn("m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
      {v.scorecardEmptyStatePreviewBullets.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );

  if (props.embedded) {
    return (
      <div data-testid="executive-scorecard-empty-preview">
        {list}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="executive-scorecard-empty-preview-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="executive-scorecard-empty-preview"
    >
      <h2 id="executive-scorecard-empty-preview-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
        {v.scorecardEmptyStatePreviewSectionTitle}
      </h2>
      <div className="mt-2">{list}</div>
    </section>
  );
}
