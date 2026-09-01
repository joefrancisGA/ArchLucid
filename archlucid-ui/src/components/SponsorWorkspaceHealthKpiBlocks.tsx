"use client";

import Link from "next/link";

import { ComplianceDriftChartPdfExport } from "@/components/ComplianceDriftChartPdfExport";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  formatHours,
  HOURS_PER_PRECOMMIT_BLOCK,
} from "@/lib/roi-assumptions";
import { executiveWorkspaceHealthKpiTitle } from "@/lib/sponsor-workspace-health-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { AUDIT_TRAIL_LABEL } from "@/lib/usability/canonical-product-terms";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { SponsorWorkspaceHealthKpiViewModel } from "./use-sponsor-workspace-health-dashboard";

export type SponsorWorkspaceHealthKpiBlocksProps = {
  readonly buyerPolishedShell: boolean;
  readonly callerRank: number;
  readonly viewModel: SponsorWorkspaceHealthKpiViewModel;
};

export function SponsorWorkspaceHealthKpiBlocks({
  buyerPolishedShell,
  callerRank,
  viewModel,
}: SponsorWorkspaceHealthKpiBlocksProps) {
  const {
    blocked30d,
    warned30d,
    highCritical90,
    driftPoints,
    dashboard,
    sla,
    onTimePct,
    blockCountLabel,
    hoursFull30,
    hoursFromBlocks,
  } = viewModel;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("preCommitOutcomes", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {buyerPolishedShell ? (
                <>
                  Rolling 30-day counts from audit-backed approval checkpoints — hard blocks vs monitored-risk signals
                  (non-blocking approval guidance).
                </>
              ) : (
                <>
                  Audit-backed counts via <span className="font-mono">GovernancePreCommitBlocked</span> and{" "}
                  <span className="font-mono">GovernancePreCommitWarned</span> in the rolling window.
                </>
              )}
            </p>
            <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                Blocked: <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{blockCountLabel}</span>{" "}
                <Link className={OPERATOR_LINK.nav} href={GOVERNANCE_AUDIT_PATH}>
                  {AUDIT_TRAIL_LABEL}
                </Link>
              </li>
              <li>
                {buyerPolishedShell ? "Monitored-risk signals" : "Warned"}
                {": "}
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {warned30d.exact ? warned30d.count : `≥ ${warned30d.count} (sampled lower bound)`}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("highCriticalExposure", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Pilot-value report severity totals in the window — exposure in the report period, not the same as an open-backlog
              aging inventory.
            </p>
            <p className={cn(
              "m-0 mt-2",
              buyerPolishedShell ? OPERATOR_TYPOGRAPHY.kpiValue : OPERATOR_TYPOGRAPHY.executiveDashboardMetric,
            )}>
              {finiteIntegerCountDisplay(highCritical90)}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link href="/governance/findings" className={OPERATOR_LINK.nav}>
                {buyerPolishedShell ? "Open risk register" : "Architecture risk register"}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 md:col-span-2">
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {executiveWorkspaceHealthKpiTitle("complianceDrift", buyerPolishedShell)}
              </h2>
              <Link href="/governance/approval-queue" className={OPERATOR_LINK.nav}>
                Resolve outcomes workflow
              </Link>
            </div>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Daily buckets (1440-minute) from compliance drift API.</p>
            <ComplianceDriftChartPdfExport points={driftPoints} />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("approvalSla", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Derived from workspace health pending approvals and recent terminal decisions.
            </p>
            <ul className={cn("m-0 mt-2 list-none space-y-1 p-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
              <li>Pending (sample cap): {dashboard.pendingCount}</li>
              <li>Overdue pending (with SLA deadline): {sla.overduePendingCount}</li>
              <li>On-track pending (with SLA deadline): {sla.onTrackPendingWithSlaCount}</li>
              <li>
                On-time decisions (reviewed on or before SLA, eligible n={sla.onTimeEligibleDecisions}): {onTimePct}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start gap-2">
              <h2 className={cn("m-0 flex-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {executiveWorkspaceHealthKpiTitle("valueProxy", buyerPolishedShell)}
              </h2>
              <FieldHelpTooltip
                label="the hours estimate"
                hint={
                  buyerPolishedShell ? (
                    <>
                      Estimated review-hours blend severity-weighted findings with an allowance per blocked merge attempt (
                      {HOURS_PER_PRECOMMIT_BLOCK} h each). Planning estimate — not measured wall-clock time.
                    </>
                  ) : (
                    <>
                      Estimated review-hours combine severity-weighted findings and {HOURS_PER_PRECOMMIT_BLOCK} h per blocked event (
                      <span className="font-mono">roi-assumptions.ts</span>). This is a planning estimate, not measured wall-clock time.
                    </>
                  )
                }
                triggerClassName="self-start"
              />
            </div>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Blocks in 30d:{" "}
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                {blocked30d.exact ? blocked30d.count : `${blocked30d.count} (sampled)`}
              </span>
              . Full hours formula includes findings severities in the same window.
            </p>
            <p className={cn("m-0 mt-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
              {formatHours(hoursFull30)}
              <span className={cn("ml-2 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                (blocks alone: {formatHours(hoursFromBlocks)})
              </span>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link href="/insights/roi-summary" className={OPERATOR_LINK.nav}>
                See ROI report
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Full USD modeling lives on the ROI report
        {callerRank >= AUTHORITY_RANK.AdminAuthority ? "" : " (Admin-only loaded $/hour line)"}.
      </p>
    </>
  );
}
