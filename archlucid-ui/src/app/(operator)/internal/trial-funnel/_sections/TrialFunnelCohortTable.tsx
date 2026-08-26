"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Dispatch, ReactElement, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TRIAL_FUNNEL_CONVERSION_NOTE } from "@/lib/trial-funnel-metric-contract";
import type { TrialFunnelCohortRow, TrialFunnelOperationalSummary, TrialFunnelPeriodDays } from "@/lib/trial-funnel-ops";

import { formatUtcLabel } from "./trial-funnel-formatters";

type LoadState = "loading" | "ready" | "error";

type CohortSortKey =
  | "organizationName"
  | "trialStartedUtc"
  | "currentStageLabel"
  | "daysInTrial"
  | "lastMeaningfulActivityUtc"
  | "firstReviewStatus"
  | "conversionStatus"
  | "estimatedFirstReviewCostUsd";

type Props = {
  readonly data: TrialFunnelOperationalSummary | null;
  readonly loadState: LoadState;
  readonly periodDays: TrialFunnelPeriodDays;
  readonly filteredCohortRows: TrialFunnelCohortRow[];
  readonly stageFilter: string;
  readonly setStageFilter: Dispatch<SetStateAction<string>>;
  readonly attentionOnly: boolean;
  readonly setAttentionOnly: Dispatch<SetStateAction<boolean>>;
  readonly sortKey: CohortSortKey;
  readonly setSortKey: Dispatch<SetStateAction<CohortSortKey>>;
  readonly sortAsc: boolean;
  readonly setSortAsc: Dispatch<SetStateAction<boolean>>;
};

export function TrialFunnelCohortTable(props: Props): ReactElement {
  const {
    attentionOnly,
    data,
    filteredCohortRows,
    loadState,
    periodDays,
    setAttentionOnly,
    setSortAsc,
    setSortKey,
    setStageFilter,
    sortAsc,
    sortKey,
    stageFilter,
  } = props;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Trial cohort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <span>Stage</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                aria-label="Filter by stage"
              >
                <option value="all">All stages</option>
                {(data?.stages ?? []).map((stage) => (
                  <option key={stage.stageId} value={stage.stageId}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <input type="checkbox" checked={attentionOnly} onChange={(event) => setAttentionOnly(event.target.checked)} />
              Needs attention only
            </label>
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <span>Sort</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as CohortSortKey)}
                aria-label="Sort cohort table"
              >
                <option value="trialStartedUtc">Trial started</option>
                <option value="organizationName">Organization</option>
                <option value="currentStageLabel">Current stage</option>
                <option value="daysInTrial">Days in trial</option>
                <option value="lastMeaningfulActivityUtc">Last activity</option>
                <option value="firstReviewStatus">First review status</option>
                <option value="conversionStatus">Conversion status</option>
                <option value="estimatedFirstReviewCostUsd">First-review AI cost</option>
              </select>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => setSortAsc((value) => !value)}>
              {sortAsc ? "Ascending" : "Descending"}
            </Button>
          </div>

          <EnterpriseTable ariaLabel="Trial cohort detail">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Organization</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Trial started</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Current stage</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Days in trial</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Last activity</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>First review</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>AI cost</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Conversion</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Attention</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {filteredCohortRows.length === 0 ? (
                <EnterpriseTableRow>
                  <EnterpriseTableCell colSpan={10}>
                    {loadState === "loading" ? "Loading cohort…" : "No trials match the selected filters."}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ) : (
                filteredCohortRows.map((row) => (
                  <EnterpriseTableRow key={row.tenantId}>
                    <EnterpriseTableCell>{row.organizationName}</EnterpriseTableCell>
                    <EnterpriseTableCell>{formatUtcLabel(row.trialStartedUtc)}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.currentStageLabel}</EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums">{row.daysInTrial ?? " — "}</EnterpriseTableCell>
                    <EnterpriseTableCell>{formatUtcLabel(row.lastMeaningfulActivityUtc)}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.firstReviewStatus}</EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums">
                      {row.estimatedFirstReviewCostUsd != null
                        ? `$${row.estimatedFirstReviewCostUsd.toFixed(2)}`
                        : "Not estimated"}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{row.conversionStatus}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.attentionLabel ?? "On track"}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <Link
                        href="/administration/ai-usage"
                        className="text-sky-700 underline underline-offset-2 dark:text-sky-300"
                      >
                        View AI usage
                      </Link>
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))
              )}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Metric definitions and data quality</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Reporting window: last {data?.dataQuality?.periodDays ?? periodDays} days
            {data?.dataQuality?.comparePreviousPeriod ? " with previous-period comparison." : "."}
          </p>
          <p className="m-0">
            Demo and showcase tenants are excluded by default ({data?.dataQuality?.excludesDemoWorkspaces ? "enabled" : "disabled"}).
          </p>
          <p className="m-0">{data?.dataQuality?.conversionDefinition ?? TRIAL_FUNNEL_CONVERSION_NOTE}</p>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {(data?.dataQuality?.stageDefinitions ?? []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            AI cost figures are estimates from recorded token usage and configured provider rates — not invoiced totals.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export type { CohortSortKey };
