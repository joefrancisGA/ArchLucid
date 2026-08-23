"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { TrialFunnelEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { TrialFunnelDemoReadinessVocabularyRail } from "@/components/trial/TrialFunnelDemoReadinessVocabularyRail";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
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
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE_SHORT } from "@/lib/buyer/buyer-polish-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { INTERNAL_TRIAL_FUNNEL_PATH } from "@/lib/internal-ops-route-paths";
import {
  TRIAL_FUNNEL_CONVERSION_NOTE,
  TRIAL_FUNNEL_PAGE_SUBTITLE,
  TRIAL_FUNNEL_PERIOD_OPTIONS,
  trialFunnelStageDefinition,
  type TrialFunnelPeriodDays,
} from "@/lib/trial-funnel-metric-contract";
import {
  fetchTrialFunnelOperationalSummary,
  type TrialFunnelCohortRow,
  type TrialFunnelOperationalSummary,
  type TrialFunnelStageMetric,
} from "@/lib/trial-funnel-ops";

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

function formatUtcLabel(iso: string | null): string {
  if (!iso) {
    return "Not recorded";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "Not recorded";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function formatPercent(value: number | null, denominatorLabel: string): string {
  if (value === null || !Number.isFinite(value)) {
    return `Unavailable — no ${denominatorLabel} in this period`;
  }

  return `${Math.round(value)}%`;
}

function formatPeriodDelta(current: number, previous: number | null): string | null {
  if (previous === null) {
    return null;
  }

  const delta = current - previous;

  if (delta === 0) {
    return "No change vs previous period";
  }

  if (delta > 0) {
    return `+${delta} vs previous period`;
  }

  return `${delta} vs previous period`;
}

function medianTimingLabel(hours: number | null, sampleSize: number | null): string {
  if (hours === null || sampleSize === null || sampleSize === 0) {
    return "Not enough completed trials in this period";
  }

  return `Median: ${hours.toFixed(1)} h · Based on ${sampleSize} trial${sampleSize === 1 ? "" : "s"}`;
}

function exportCohortCsv(rows: TrialFunnelCohortRow[]): void {
  const header = [
    "Organization",
    "Trial started",
    "Current stage",
    "Days in trial",
    "Last activity",
    "First review status",
    "Estimated first-review AI cost USD",
    "Conversion status",
    "Attention",
  ];

  const lines = rows.map((row) =>
    [
      row.organizationName,
      row.trialStartedUtc ?? "",
      row.currentStageLabel,
      row.daysInTrial?.toString() ?? "",
      row.lastMeaningfulActivityUtc ?? "",
      row.firstReviewStatus,
      row.estimatedFirstReviewCostUsd?.toFixed(2) ?? "",
      row.conversionStatus,
      row.attentionLabel ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "trial-funnel-cohort.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function FunnelStageBar({ stage, maxCount }: { stage: TrialFunnelStageMetric; maxCount: number }): ReactElement {
  const widthPercent = maxCount > 0 ? Math.max(8, Math.round((stage.count / maxCount) * 100)) : 8;

  return (
    <div className="space-y-1">
      <div
        className="h-3 rounded-sm bg-sky-700/80 dark:bg-sky-500/70"
        style={{ width: `${widthPercent}%` }}
        role="img"
        aria-label={`${stage.label}: ${stage.count} trials`}
      />
      <p className={cn("m-0 tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {stage.count}
        {stage.percentOfTrialStarts !== null ? ` · ${Math.round(stage.percentOfTrialStarts)}% of trial starts` : null}
        {stage.percentFromPreviousStage !== null && stage.stageId !== "trial-started"
          ? ` · ${Math.round(stage.percentFromPreviousStage)}% from previous stage`
          : null}
      </p>
      {formatPeriodDelta(stage.count, stage.previousPeriodCount) ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {formatPeriodDelta(stage.count, stage.previousPeriodCount)}
        </p>
      ) : null}
    </div>
  );
}

export function TrialFunnelOpsPageClient(): ReactElement {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [data, setData] = useState<TrialFunnelOperationalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [periodDays, setPeriodDays] = useState<TrialFunnelPeriodDays>(30);
  const [comparePrevious, setComparePrevious] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sortKey, setSortKey] = useState<CohortSortKey>("trialStartedUtc");
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshAnnouncement, setRefreshAnnouncement] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    try {
      const next = await fetchTrialFunnelOperationalSummary({ periodDays, comparePrevious });
      setData(next);
      setLoadState("ready");
      setRefreshAnnouncement(`Trial funnel data refreshed at ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Trial metrics could not be loaded. Try again.");
      setLoadState("error");
      setRefreshAnnouncement("Trial funnel refresh failed.");
    }
  }, [comparePrevious, periodDays]);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

  const maxStageCount = useMemo(
    () => Math.max(0, ...(data?.stages ?? []).map((stage) => stage.count)),
    [data?.stages],
  );

  const filteredCohortRows = useMemo(() => {
    let rows = [...(data?.cohortRows ?? [])];

    if (stageFilter !== "all") {
      rows = rows.filter((row) => row.currentStageId === stageFilter);
    }

    if (attentionOnly) {
      rows = rows.filter((row) => row.attentionLabel !== null);
    }

    rows.sort((left, right) => {
      const direction = sortAsc ? 1 : -1;

      if (sortKey === "organizationName") {
        return left.organizationName.localeCompare(right.organizationName) * direction;
      }

      if (sortKey === "currentStageLabel") {
        return left.currentStageLabel.localeCompare(right.currentStageLabel) * direction;
      }

      if (sortKey === "firstReviewStatus") {
        return left.firstReviewStatus.localeCompare(right.firstReviewStatus) * direction;
      }

      if (sortKey === "conversionStatus") {
        return left.conversionStatus.localeCompare(right.conversionStatus) * direction;
      }

      if (sortKey === "daysInTrial") {
        return ((left.daysInTrial ?? -1) - (right.daysInTrial ?? -1)) * direction;
      }

      if (sortKey === "estimatedFirstReviewCostUsd") {
        return ((left.estimatedFirstReviewCostUsd ?? -1) - (right.estimatedFirstReviewCostUsd ?? -1)) * direction;
      }

      if (sortKey === "lastMeaningfulActivityUtc") {
        const leftTime = left.lastMeaningfulActivityUtc ? Date.parse(left.lastMeaningfulActivityUtc) : 0;
        const rightTime = right.lastMeaningfulActivityUtc ? Date.parse(right.lastMeaningfulActivityUtc) : 0;

        return (leftTime - rightTime) * direction;
      }

      const leftTime = left.trialStartedUtc ? Date.parse(left.trialStartedUtc) : 0;
      const rightTime = right.trialStartedUtc ? Date.parse(right.trialStartedUtc) : 0;

      return (leftTime - rightTime) * direction;
    });

    return rows;
  }, [attentionOnly, data?.cohortRows, sortAsc, sortKey, stageFilter]);

  const lastUpdatedLabel = data?.dataQuality?.generatedAtUtc
    ? formatUtcLabel(data.dataQuality.generatedAtUtc)
    : loadState === "loading"
      ? "Refreshing…"
      : "Not available";

  if (isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading trial metrics…</p>;
  }

  if (!isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        {FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE_SHORT}
      </p>
    );
  }

  const trialStarts = data?.signupAttempts30Days ?? 0;
  const cost = data?.firstReviewCost;
  const timing = data?.timing;

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="trial-funnel-ops-page">
      <OperatorPageHeader
        navHref={INTERNAL_TRIAL_FUNNEL_PATH}
        title="Trial funnel"
        subtitle={TRIAL_FUNNEL_PAGE_SUBTITLE}
        titleTestId="trial-funnel-page-title"
        metadata={
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Last updated: <time dateTime={data?.dataQuality?.generatedAtUtc ?? undefined}>{lastUpdatedLabel}</time>
          </p>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <span className={OPERATOR_NAV_GROUP_LABEL}>Date range</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                value={periodDays}
                onChange={(event) => setPeriodDays(Number(event.target.value) as TrialFunnelPeriodDays)}
                aria-label="Date range"
              >
                {TRIAL_FUNNEL_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(event) => setComparePrevious(event.target.checked)}
              />
              Compare with previous period
            </label>
            <RefreshButton busy={loadState === "loading"} onClick={() => void refresh()} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(data?.cohortRows.length ?? 0) === 0}
              onClick={() => exportCohortCsv(data?.cohortRows ?? [])}
            >
              Export cohort
            </Button>
            <PageContextualHelpButton />
          </div>
        }
      />
      <TrialFunnelEvidenceOrientationStrip />
      <TrialFunnelDemoReadinessVocabularyRail currentSurfaceId="trial-funnel" />
      <div className="sr-only" role="status" aria-live="polite">
        {refreshAnnouncement}
      </div>

      {error ? (
        <div className={cn(DESIGN_TOKENS.callout.blocked, "p-4")} role="alert">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{error}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      ) : null}

      {data?.dataQuality?.instrumentationWarning ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warn, "p-4")}
          role="status"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {data.dataQuality.instrumentationWarning}
          </p>
        </div>
      ) : null}

      {loadState === "loading" && !data ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading trial metrics…</p>
      ) : null}

      {loadState === "ready" && trialStarts === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No trials started during the selected period.
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Funnel overview</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_LAYOUT.sectionStack}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Active trials</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {loadState === "loading" && !data ? "Loading…" : (data?.activeSelfServiceTrials ?? 0)}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Trial starts</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>{trialStarts}</p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>First reviews finalized</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {data?.firstCommittedReviews30Days ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Converted</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {data?.trialConversions30Days ?? 0}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{TRIAL_FUNNEL_CONVERSION_NOTE}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4" aria-label="Funnel stage bars">
              {(data?.stages ?? []).map((stage) => {
                const definition = trialFunnelStageDefinition(stage.stageId);

                return (
                  <div key={stage.stageId}>
                    <div className="inline-flex items-center gap-1">
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {stage.label}
                      </p>
                      {definition?.definition ? (
                        <FieldHelpTooltip label={stage.label} hint={definition.definition} />
                      ) : null}
                    </div>
                    <FunnelStageBar stage={stage} maxCount={maxStageCount} />
                  </div>
                );
              })}
            </div>

            <EnterpriseTable ariaLabel="Funnel stages accessible table">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Count</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>% of trial starts</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>% from previous</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {(data?.stages ?? []).map((stage) => (
                  <EnterpriseTableRow key={`table-${stage.stageId}`}>
                    <EnterpriseTableCell>{stage.label}</EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums">{stage.count}</EnterpriseTableCell>
                    <EnterpriseTableCell>{formatPercent(stage.percentOfTrialStarts, "trial starts")}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {stage.stageId === "trial-started"
                        ? " — "
                        : formatPercent(stage.percentFromPreviousStage, "prior-stage completions")}
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Activation and review timing</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Trial start to first review finalized</p>
              <p className="m-0">
                {medianTimingLabel(
                  timing?.medianTrialStartToFirstReviewFinalizedHours ?? null,
                  timing?.medianTrialStartToFirstReviewFinalizedSampleSize ?? null,
                )}
              </p>
            </div>
            <div>
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Trial start to conversion</p>
              <p className="m-0">
                {medianTimingLabel(
                  timing?.medianTrialStartToConversionHours ?? null,
                  timing?.medianTrialStartToConversionSampleSize ?? null,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>First-review AI cost</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {cost?.status === "estimated" ? (
              <>
                <p className="m-0">
                  Median estimated cost:{" "}
                  <span className="tabular-nums font-medium">
                    ${cost.medianEstimatedUsd?.toFixed(2) ?? "Not available"}
                  </span>
                </p>
                <p className="m-0">
                  Observed range:{" "}
                  <span className="tabular-nums">
                    ${cost.lowEstimatedUsd?.toFixed(2) ?? " — "}–${cost.highEstimatedUsd?.toFixed(2) ?? " — "}
                  </span>
                </p>
                <p className="m-0">Sample: {cost.sampleSize} first completed review{cost.sampleSize === 1 ? "" : "s"}</p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{cost.statusDetail}</p>
              </>
            ) : (
              <p className="m-0">{cost?.statusDetail ?? "No first reviews were completed in the selected cohort."}</p>
            )}
          </CardContent>
        </Card>
      </div>

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
    </OperatorPageContainer>
  );
}
