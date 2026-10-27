import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { SeverityTag } from "@/components/ui/severity-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDINGS_SNAPSHOT_CHECKLIST_CATEGORY_NOT_STORED,
  FINDINGS_SNAPSHOT_CHECKLIST_RECOMMENDATION_NOT_STORED,
  type ChecklistCoverageItem,
} from "@/lib/findings/findings-snapshot-insight-density";
import {
  severityBadgeLabel,
  severityKindFromNumericValue,
} from "@/lib/quick-decision-severity-labels";

export type CoverageChecklistPanelProps = {
  readonly items: readonly ChecklistCoverageItem[];
  readonly className?: string;
};

/** TB-384: compact hygiene checklist separate from decision-grade findings. */
export function CoverageChecklistPanel(props: CoverageChecklistPanelProps): ReactElement | null {
  if (props.items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="coverage-checklist-heading"
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-700",
        props.className,
      )}
      data-testid="coverage-checklist-panel"
    >
      <div className="mb-3 space-y-1">
        <h3
          id="coverage-checklist-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          Coverage checklist
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Basic hygiene observations demoted from decision-grade findings — review for completeness, not governance blocking.
        </p>
      </div>
      <ul className="m-0 list-none space-y-2 p-0">
        {props.items.map((item) => (
          <li
            key={item.findingId}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"
            data-testid={`coverage-checklist-item-${item.findingId}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityTag
                severity={item.severityValue}
                kind={severityKindFromNumericValue(item.severityValue)}
                label={severityBadgeLabel(item.severityValue)}
              />
              <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{item.title}</span>
            </div>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {item.category ?? FINDINGS_SNAPSHOT_CHECKLIST_CATEGORY_NOT_STORED}
            </p>
            <p className={cn("m-0 mt-1 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {item.recommendation !== null && item.recommendation.trim().length > 0
                ? item.recommendation
                : FINDINGS_SNAPSHOT_CHECKLIST_RECOMMENDATION_NOT_STORED}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
