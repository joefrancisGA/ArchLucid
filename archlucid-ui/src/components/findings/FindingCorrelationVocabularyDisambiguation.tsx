import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import {
  FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES,
  FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_TITLE,
} from "@/lib/vocabulary/finding-correlation-vocabulary";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingCorrelationVocabularyDisambiguationProps = {
  readonly testId?: string;
};

/** Collapsible disambiguation for ADR 0063 vs ITSM vs ROI portfolio deduplication (TB-2065). */
export function FindingCorrelationVocabularyDisambiguation(
  props: FindingCorrelationVocabularyDisambiguationProps,
): ReactElement {
  return (
    <details
      className={cn("mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId ?? "finding-correlation-vocabulary-disambiguation"}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_TITLE}
      </summary>
      <ul className="m-0 mt-2 list-disc space-y-2 pl-5 text-al-text-secondary">
        {FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES.map((line) => (
          <li key={line.label}>
            <strong className="text-al-text-primary">{line.label}:</strong> {line.description}
          </li>
        ))}
      </ul>
    </details>
  );
}
