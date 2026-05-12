import {
  auditExportExecuteRankAuditorRoleNote,
  auditExportSectionSupportingLineBuyerPolished,
  auditSearchSectionLeadBuyerPolishedLine,
} from "@/lib/enterprise-controls-context-copy";
type BuyerAuditTrailMetrics = {
  eventCount: number;
  humanActorCount: number;
  systemRecordedCount: number;
};

type AuditBuyerHeaderMetricsProps = {
  buyerAuditTrailSummaryLine: string | null;
  buyerAuditTrailMetrics: BuyerAuditTrailMetrics | null;
  displayEventCount: number;
  exportRoleOk: boolean;
};

export function AuditBuyerHeaderMetrics(props: AuditBuyerHeaderMetricsProps) {
  const {
    buyerAuditTrailSummaryLine,
    buyerAuditTrailMetrics,
    displayEventCount,
    exportRoleOk,
  } = props;

  return (
    <>
      <p className="mb-3 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
        {auditSearchSectionLeadBuyerPolishedLine}
      </p>
      {buyerAuditTrailSummaryLine !== null ? (
        <p
          className="mb-3 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100"
          data-testid="audit-buyer-summary-line"
        >
          {buyerAuditTrailSummaryLine}
        </p>
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
              Human actors
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {buyerAuditTrailMetrics.humanActorCount}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              System-recorded
            </p>
            <p className="m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {buyerAuditTrailMetrics.systemRecordedCount}
            </p>
          </div>
        </div>
      ) : null}
      {displayEventCount > 0 ? (
        <p
          className="mb-3 max-w-prose text-xs text-neutral-600 dark:text-neutral-400"
          data-testid="audit-buyer-csv-eligibility-line"
        >
          <span>{auditExportSectionSupportingLineBuyerPolished}</span>{" "}
          {!exportRoleOk ? <span>{auditExportExecuteRankAuditorRoleNote}</span> : null}
        </p>
      ) : null}
    </>
  );
}
