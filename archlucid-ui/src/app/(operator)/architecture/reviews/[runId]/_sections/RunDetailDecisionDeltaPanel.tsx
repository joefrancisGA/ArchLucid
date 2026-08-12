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
import type { RunDetailDecisionDeltaView } from "@/lib/runs/run-detail-decision-delta";

export type RunDetailDecisionDeltaPanelProps = {
  readonly runId: string;
  readonly view: RunDetailDecisionDeltaView;
};

/**
 * Sixty-second decision delta — top material findings with policy rule keys and evidence anchors.
 * Mirrors `SponsorDecisionDeltaNoveltyResolver.CollectMaterialFindings` client-side from run detail.
 */
export function RunDetailDecisionDeltaPanel(props: RunDetailDecisionDeltaPanelProps): ReactElement {
  const { runId, view } = props;

  return (
    <aside
      aria-labelledby="run-detail-decision-delta-heading"
      className="rounded-md border border-teal-700/30 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20"
      data-testid={RUN_DETAIL_DECISION_DELTA_PANEL_TEST_ID}
    >
      <h3
        id="run-detail-decision-delta-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Decision delta
      </h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Top recommended changes from this committed review — severity, compliance rule key, and evidence
        anchor. Expand findings below for full assessment detail.
      </p>

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
                <span className={cn("font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {row.rank}.
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
                    No mapped compliance rule key
                  </span>
                )}
              </div>

              {row.evidenceAnchorHint !== null ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Evidence anchor: {row.evidenceAnchorHint}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
