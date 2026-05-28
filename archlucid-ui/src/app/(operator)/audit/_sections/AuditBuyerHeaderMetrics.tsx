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
          className="mb-3 max-w-prose rounded-md border border-teal-200/70 bg-teal-50/50 px-3 py-3 text-sm text-neutral-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-neutral-100"
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
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Recorded events
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {buyerAuditTrailMetrics.eventCount}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Named reviewers
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {buyerAuditTrailMetrics.humanActorCount}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              System-recorded events
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {buyerAuditTrailMetrics.systemRecordedCount}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
