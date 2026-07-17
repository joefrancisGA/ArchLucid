"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
  computeArchitectureRiskRegisterSummary,
  matchesRiskRegisterFilter,
} from "@/lib/architecture-risk-register-page";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { cn } from "@/lib/utils";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

/**
 * Findings hub: cross-run queue from explainability aggregates, plus a deterministic PHI sample row in public demo mode.
 */
export default function GovernanceFindingsQueueClient() {
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const { rows, loading, loadFailed, refresh } = useGovernanceFindingsQuery();
  const {
    registerFilter,
    setRegisterFilter,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
  } = useGovernanceFindingsFilter();

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const displayedRows = useMemo(
    () => rows.filter((row) => matchesRiskRegisterFilter(row, registerFilter)),
    [rows, registerFilter],
  );
  const registerSummary = useMemo(() => computeArchitectureRiskRegisterSummary(rows), [rows]);
  const pageTitle = buyerPolishedShell ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE : ARCHITECTURE_RISK_REGISTER_PAGE_TITLE;
  const pageSubtitle = buyerPolishedShell
    ? BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD
    : ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE;

  return (
    <div className="w-full max-w-[1440px]">
      {buyerPolishedShell ? (
        <GovernanceApprovalStatusBanner className="mb-4" onRiskRegisterPage />
      ) : (
        <LayerHeader pageKey="governance-findings" density="compact" />
      )}

      <OperatorPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        titleTestId="architecture-risk-register-page-title"
        metadata={
          !buyerPolishedShell && !loading ? (
            <>
              <span data-testid="architecture-risk-register-summary-open">
                Open risks: {registerSummary.openRisks}
              </span>
              <span data-testid="architecture-risk-register-summary-expiring">
                Expiring exceptions: {registerSummary.expiringExceptions}
              </span>
              <span data-testid="architecture-risk-register-summary-owner">
                Pending owner: {registerSummary.pendingOwner}
              </span>
              <span data-testid="architecture-risk-register-summary-overdue">
                Overdue review: {registerSummary.overdueReview}
              </span>
            </>
          ) : undefined
        }
      />

      <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
        {!buyerPolishedShell && !loading && rows.length > 0 ? (
          <GovernanceFindingsFilterBar
            registerFilter={registerFilter}
            onRegisterFilterChange={setRegisterFilter}
            savedPresets={savedPresets}
            onSaveCurrentFilterAsPreset={saveCurrentFilterAsPreset}
            onRemovePreset={removePreset}
            groupByResource={groupByResource}
            onToggleGroupByResource={toggleGroupByResource}
            displayedRows={displayedRows}
          />
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <EnterpriseCompactEmptyState {...GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT} />
        ) : null}

        {!loading && displayedRows.length > 0 ? (
          <GovernanceFindingsList
            displayedRows={displayedRows}
            buyerPolishedShell={buyerPolishedShell}
            groupByResource={groupByResource}
            selectedFindingIds={selectedFindingIds}
            onSelectionChange={setSelectedFindingIds}
            onBulkApplied={() => {
              setSelectedFindingIds(new Set());
              refresh();
            }}
          />
        ) : null}

        {!loading && rows.length === 0 ? (
          <>
            <EnterpriseCompactEmptyState
              testId="governance-findings-empty-state"
              title={buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_TITLE : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE}
              description={
                loadFailed
                  ? buyerPolishedShell
                    ? "We could not load risks for this review. Check your connection, or open reviews and try again."
                    : "We could not load the architecture risk register for this workspace — check connectivity, then open the curated Claims Intake example if you are in demo mode."
                  : buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_BODY
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
              }
              actions={[
                { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
                {
                  label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open governance workflow",
                  href: "/governance",
                  variant: "outline",
                },
              ]}
              footer={
                !buyerPolishedShell ? (
                  <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                    View policy packs
                  </Link>
                ) : undefined
              }
            />
            {loadFailed ? (
              <FatalPageReportProblemSupportRow
                surfaceId="governance-findings-queue-hard-failure"
                errorTitle={pageTitle}
                errorCode="governance-findings-load-failed"
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
