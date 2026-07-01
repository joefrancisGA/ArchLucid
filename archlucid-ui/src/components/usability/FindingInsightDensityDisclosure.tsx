import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInsightDensityDisclosureProps = {
  readonly insightDensityScore: number | null;
  readonly whyThisIsNotGeneric: string | null;
  readonly className?: string;
};

/** Optional insight-density fields behind disclosure on finding detail surfaces. */
export function FindingInsightDensityDisclosure(props: FindingInsightDensityDisclosureProps): ReactElement | null {
  const hasScore = props.insightDensityScore !== null && Number.isFinite(props.insightDensityScore);
  const whyText = props.whyThisIsNotGeneric?.trim() ?? "";

  if (!hasScore && whyText.length === 0) {
    return null;
  }

  return (
    <details
      className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40", props.className)}
      data-testid="finding-insight-density-disclosure"
    >
      <summary className={cn("cursor-pointer font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Insight density signals
      </summary>
      <dl className={cn("m-0 mt-2 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
        {hasScore ? (
          <div>
            <dt className="font-semibold text-al-text-primary">Insight density score</dt>
            <dd className="m-0 tabular-nums text-al-text-secondary">{Math.trunc(props.insightDensityScore ?? 0)}</dd>
          </div>
        ) : null}
        {whyText.length > 0 ? (
          <div>
            <dt className="font-semibold text-al-text-primary">Why this is not generic</dt>
            <dd className="m-0 leading-relaxed text-al-text-secondary">{whyText}</dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}
