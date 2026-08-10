"use client";

import { cn } from "@/lib/utils";

import { HealthCheckRow } from "@/components/health-dashboard/HealthDashboardSections";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HealthExceptionRow } from "@/lib/health-readiness-exceptions";

export type HealthNeedsAttentionPanelProps = {
  readonly exceptions: readonly HealthExceptionRow[];
  readonly anchorId: string;
  readonly testId: string;
};

/**
 * Exceptions hoisted above the all-green majority. Renders nothing when every check passes —
 * the overall-status hero already carries that message.
 */
export function HealthNeedsAttentionPanel(props: HealthNeedsAttentionPanelProps): React.JSX.Element | null {
  if (props.exceptions.length === 0) {
    return null;
  }

  const headingId = `${props.anchorId}-heading`;

  return (
    <section
      id={props.anchorId}
      // Focusable so the hero and tile jump links can move keyboard focus here, not just scroll.
      tabIndex={-1}
      aria-labelledby={headingId}
      className="space-y-2 rounded-md border border-neutral-300 p-4 dark:border-neutral-700"
      data-testid={props.testId}
    >
      <h2 id={headingId} className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Needs attention ({props.exceptions.length})
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Checks that are not reporting healthy, worst state first.
      </p>
      <div className="space-y-2">
        {props.exceptions.map((exception) => (
          <HealthCheckRow
            key={exception.row.checkId}
            row={exception.row}
            contextLabel={exception.groupTitle}
            disclosureScope="needs attention"
          />
        ))}
      </div>
    </section>
  );
}
