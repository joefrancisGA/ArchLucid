import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { FindingPolicyRuleBadge } from "@/components/findings/FindingPolicyRuleBadge";
import { FindingTrustChipFromSet } from "@/components/findings/FindingTrustChip";
import { SeverityTag } from "@/components/ui/severity-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID,
  RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID,
} from "@/lib/runs/run-detail-decision-delta-alignment";
import {
  formatDecisionDeltaOmittedOpenFindingsLine,
  RUN_DETAIL_DECISION_DELTA_EMPTY_INTRO,
  RUN_DETAIL_DECISION_DELTA_POPULATED_INTRO,
} from "@/lib/runs/run-detail-decision-delta-panel-copy";
import type { RunDetailDecisionDeltaView } from "@/lib/runs/run-detail-decision-delta";

export type RunDetailDecisionDeltaPanelProps = {
  readonly runId: string;
  readonly view: RunDetailDecisionDeltaView;
};

export function RunDetailDecisionDeltaPanel(props: RunDetailDecisionDeltaPanelProps): ReactElement {
  const { runId, view } = props;
  const intro =
    view.emptyMessage !== null ? RUN_DETAIL_DECISION_DELTA_EMPTY_INTRO : RUN_DETAIL_DECISION_DELTA_POPULATED_INTRO;

  return (
    <aside
      aria-labelledby="run-detail-decision-delta-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid={RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID}
    >
      <h3
        id="run-detail-decision-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Decision delta
      </h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{intro}</p>

      {view.emptyMessage !== null ? (
        <p
          className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-detail-decision-delta-empty"
        >
          {view.emptyMessage}
        </p>
      ) : (
        <ol className="m-0 mt-3 list-none space-y-2 p-0">
          {view.rows.map((row) => (
            <li
              key={row.findingId}
              className="rounded-md border border-neutral-200 bg-white/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40"
              data-testid={RUN_DETAIL_DECISION_DELTA_ROW_TEST_ID}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Severity sort {row.rank}
                </span>
                <SeverityTag severity={row.severityLabel} label={row.severityLabel} />
                <Link
                  href={`/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(row.findingId)}`}
                  prefetch={false}
                  className={cn(OPERATOR_LINK.inline, "min-w-0 flex-1 font-medium")}
                >
                  {row.title}
                </Link>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <FindingTrustChipFromSet chipSet={row.trustChipSet} />
                {row.policyRuleId !== null ? (
                  <FindingPolicyRuleBadge policyRuleId={row.policyRuleId} />
                ) : (
                  <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Compliance rule was not stored.
                  </span>
                )}
              </div>

              {row.evidenceAnchorHint !== null ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Evidence anchor: {row.evidenceAnchorHint}
                </p>
              ) : row.evidenceRefCountNotStored ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Evidence reference count was not stored.
                </p>
              ) : (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Evidence anchor was not stored.
                </p>
              )}
            </li>
          ))}
          {view.omittedOpenFindingCount !== null && view.omittedOpenFindingCount > 0 ? (
            <li className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {formatDecisionDeltaOmittedOpenFindingsLine(view.omittedOpenFindingCount)}
            </li>
          ) : null}
        </ol>
      )}
    </aside>
  );
}
