import { cn } from "@/lib/utils";

import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingDecisionSummary } from "./finding-detail-route-display";

export type FindingDetailDecisionSummaryProps = {
  readonly summary: FindingDecisionSummary;
};

/** Compact executive decision summary near the top of the finding detail page. */
export function FindingDetailDecisionSummary(props: FindingDetailDecisionSummaryProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className="rounded-xl border border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-neutral-950/70"
      data-testid="finding-detail-decision-summary"
      aria-label="Decision summary"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Decision summary
      </h2>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Severity</dt>
          <dd className="m-0 mt-0.5 font-semibold text-al-text-primary">{summary.severity}</dd>
        </div>
        <div>
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Disposition</dt>
          <dd className="m-0 mt-0.5 font-semibold text-al-text-primary">{summary.disposition}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Business impact</dt>
          <dd className="m-0 mt-0.5 text-al-text-primary">{summary.businessImpact}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Required monitoring</dt>
          <dd className="m-0 mt-0.5 text-al-text-primary">{summary.requiredMonitoring}</dd>
        </div>
        <div>
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Evidence confidence</dt>
          <dd className="m-0 mt-0.5">
            {summary.evidenceConfidenceLevel === "High" ||
            summary.evidenceConfidenceLevel === "Medium" ||
            summary.evidenceConfidenceLevel === "Low" ? (
              <FindingConfidenceBadge level={summary.evidenceConfidenceLevel} />
            ) : (
              <span className="font-medium text-al-text-primary">{summary.evidenceConfidenceLabel}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Next review</dt>
          <dd className="m-0 mt-0.5 font-medium text-al-text-primary">{summary.nextReview}</dd>
        </div>
        <div>
          <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_KPI_CARD_TITLE)}>Risk owner</dt>
          <dd className="m-0 mt-0.5 font-medium text-al-text-primary">{summary.riskOwner}</dd>
        </div>
      </dl>
    </section>
  );
}
