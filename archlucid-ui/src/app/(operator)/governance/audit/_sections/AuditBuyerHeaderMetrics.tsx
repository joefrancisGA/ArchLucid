import Link from "next/link";

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
import {
  auditBuyerHeaderMetricHref,
  type AuditBuyerHeaderMetricCategory,
} from "@/lib/governance/audit-buyer-header-metric-hrefs";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { BuyerAuditGovernanceSummary } from "@/lib/audit-trail-page-helpers";

type AuditBuyerHeaderMetricsProps = {
  readonly buyerAuditTrailMetrics: BuyerAuditGovernanceSummary;
};

export function AuditBuyerHeaderMetrics(props: AuditBuyerHeaderMetricsProps): React.JSX.Element {
  const { buyerAuditTrailMetrics } = props;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="audit-buyer-metric-tiles">
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_TOTAL_EVENTS}
        value={String(buyerAuditTrailMetrics.totalEvents)}
        hrefCategory="total"
        testId="audit-buyer-metric-total-events"
      />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_DECISIONS}
        value={String(buyerAuditTrailMetrics.decisions)}
        hrefCategory="decisions"
        testId="audit-buyer-metric-decisions"
      />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_EVIDENCE_CHANGES}
        value={String(buyerAuditTrailMetrics.evidenceChanges)}
        hrefCategory="evidenceChanges"
        testId="audit-buyer-metric-evidence-changes"
      />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_APPROVALS}
        value={String(buyerAuditTrailMetrics.approvals)}
        hrefCategory="approvals"
        testId="audit-buyer-metric-approvals"
      />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_EXPORTS}
        value={String(buyerAuditTrailMetrics.exports)}
        hrefCategory="exports"
        testId="audit-buyer-metric-exports"
      />
      <AuditSummaryMetricTile
        label={AUDIT_TRAIL_SUMMARY_LAST_ACTIVITY}
        value={formatBuyerAuditTrailLastActivity(buyerAuditTrailMetrics.lastActivityUtc)}
        compactValue
        testId="audit-buyer-metric-last-activity"
      />
    </div>
  );
}

type AuditSummaryMetricTileProps = {
  readonly label: string;
  readonly value: string;
  readonly compactValue?: boolean;
  readonly hrefCategory?: AuditBuyerHeaderMetricCategory;
  readonly testId?: string;
};

function AuditSummaryMetricTile(props: AuditSummaryMetricTileProps): React.JSX.Element {
  const { label, value, compactValue = false, hrefCategory, testId } = props;
  const valueClassName = compactValue ? OPERATOR_TYPOGRAPHY.body : OPERATOR_TYPOGRAPHY.kpiValue;
  const href = hrefCategory !== undefined ? auditBuyerHeaderMetricHref(hrefCategory) : undefined;
  const metricLabel = `${value} ${label.toLowerCase()} · workspace`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className={cn("m-0 uppercase tracking-wide", OPERATOR_KPI_CARD_TITLE)}>{label}</p>
      {href !== undefined ? (
        <Link
          href={href}
          className={cn("m-0 mt-2 block", valueClassName, OPERATOR_LINK.nav)}
          data-testid={testId}
          aria-label={metricLabel}
        >
          {value}
        </Link>
      ) : (
        <p className={cn("m-0 mt-2", valueClassName)} data-testid={testId}>{value}</p>
      )}
      {href !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>workspace</p>
      ) : null}
    </div>
  );
}
