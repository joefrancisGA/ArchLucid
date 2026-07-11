import { cn } from "@/lib/utils";
import {
  AUDIT_TRAIL_SUMMARY_APPROVALS,
  AUDIT_TRAIL_SUMMARY_DECISIONS,
  AUDIT_TRAIL_SUMMARY_EVIDENCE_CHANGES,
  AUDIT_TRAIL_SUMMARY_EXPORTS,
  AUDIT_TRAIL_SUMMARY_LAST_ACTIVITY,
  AUDIT_TRAIL_SUMMARY_TOTAL_EVENTS,
} from "@/lib/audit-trail-page-copy";
import { formatBuyerAuditTrailLastActivity } from "@/lib/audit-trail-page-helpers";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { BuyerAuditGovernanceSummary } from "@/lib/audit-trail-page-helpers";

type AuditBuyerHeaderMetricsProps = {
  readonly buyerAuditTrailMetrics: BuyerAuditGovernanceSummary;
};

export function AuditBuyerHeaderMetrics(props: AuditBuyerHeaderMetricsProps): React.JSX.Element {
  const { buyerAuditTrailMetrics } = props;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="audit-buyer-metric-tiles">
      <AuditSummaryMetricTile label={AUDIT_TRAIL_SUMMARY_TOTAL_EVENTS} value={String(buyerAuditTrailMetrics.totalEvents)} />
      <AuditSummaryMetricTile label={AUDIT_TRAIL_SUMMARY_DECISIONS} value={String(buyerAuditTrailMetrics.decisions)} />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_EVIDENCE_CHANGES}
        value={String(buyerAuditTrailMetrics.evidenceChanges)}
      />
      <AuditSummaryMetricTile label={AUDIT_TRAIL_SUMMARY_APPROVALS} value={String(buyerAuditTrailMetrics.approvals)} />
      <AuditSummaryMetricTile label={AUDIT_TRAIL_SUMMARY_EXPORTS} value={String(buyerAuditTrailMetrics.exports)} />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_LAST_ACTIVITY}
        value={formatBuyerAuditTrailLastActivity(buyerAuditTrailMetrics.lastActivityUtc)}
        compactValue
      />
    </div>
  );
}

type AuditSummaryMetricTileProps = {
  readonly label: string;
  readonly value: string;
  readonly compactValue?: boolean;
};

function AuditSummaryMetricTile(props: AuditSummaryMetricTileProps): React.JSX.Element {
  const { label, value, compactValue = false } = props;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className={cn("m-0 uppercase tracking-wide", OPERATOR_KPI_CARD_TITLE)}>{label}</p>
      <p className={cn("m-0 mt-2", compactValue ? OPERATOR_TYPOGRAPHY.body : OPERATOR_TYPOGRAPHY.kpiValue)}>{value}</p>
    </div>
  );
}
