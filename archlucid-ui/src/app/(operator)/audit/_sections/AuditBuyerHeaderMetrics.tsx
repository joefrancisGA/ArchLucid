import { cn } from "@/lib/utils";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type BuyerAuditTrailMetrics = {
  eventCount: number;
  humanActorCount: number;
  systemRecordedCount: number;
};

type AuditBuyerHeaderMetricsProps = {
  buyerAuditTrailSummaryLine: string | null;
  buyerAuditTrailMetrics: BuyerAuditTrailMetrics | null;
};

export function AuditBuyerHeaderMetrics(props: AuditBuyerHeaderMetricsProps) {
  const { buyerAuditTrailSummaryLine, buyerAuditTrailMetrics } = props;

  return (
    <>
      {buyerAuditTrailSummaryLine !== null ? (
        <div
          className={cn(
            "mb-3 max-w-prose rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="audit-buyer-proof-narrative"
        >
          {buyerAuditTrailSummaryLine}
        </div>
      ) : null}
      {buyerAuditTrailMetrics !== null ? (
        <div
          className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
          data-testid="audit-buyer-metric-tiles"
        >
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={cn("m-0 uppercase tracking-wide", OPERATOR_KPI_CARD_TITLE)}>Recorded events</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>{buyerAuditTrailMetrics.eventCount}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={cn("m-0 uppercase tracking-wide", OPERATOR_KPI_CARD_TITLE)}>Named reviewers</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>{buyerAuditTrailMetrics.humanActorCount}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className={cn("m-0 uppercase tracking-wide", OPERATOR_KPI_CARD_TITLE)}>System-recorded events</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
              {buyerAuditTrailMetrics.systemRecordedCount}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
