"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { TrialFunnelEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { TrialFunnelDemoReadinessVocabularyRail } from "@/components/trial/TrialFunnelDemoReadinessVocabularyRail";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { RefreshButton } from "@/components/ui/refresh-button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE_SHORT } from "@/lib/buyer/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { INTERNAL_TRIAL_FUNNEL_PATH } from "@/lib/internal-ops-route-paths";
import {
  TRIAL_FUNNEL_PAGE_SUBTITLE,
  TRIAL_FUNNEL_PERIOD_OPTIONS,
  type TrialFunnelPeriodDays,
} from "@/lib/trial-funnel-metric-contract";
import {
  parseTrialFunnelAttentionOnlyFromSearch,
  parseTrialFunnelCohortSortAscFromSearch,
  parseTrialFunnelCohortSortKeyFromSearch,
  parseTrialFunnelComparePreviousFromSearch,
  parseTrialFunnelPeriodDaysFromSearch,
  parseTrialFunnelStageFromSearch,
  trialFunnelAttentionHrefFromSearch,
  trialFunnelCohortSortHrefFromSearch,
  trialFunnelCompareHrefFromSearch,
  trialFunnelPeriodHrefFromSearch,
  trialFunnelStageHrefFromSearch,
  type TrialFunnelCohortSortKey,
} from "@/lib/internal/trial-funnel-filter-url";
import {
  fetchTrialFunnelOperationalSummary,
  type TrialFunnelOperationalSummary,
} from "@/lib/trial-funnel-ops";

import { exportCohortCsv, formatUtcLabel } from "./trial-funnel-formatters";
import { TrialFunnelCohortTable } from "./TrialFunnelCohortTable";
import { TrialFunnelOverviewSection } from "./TrialFunnelOverviewSection";

type LoadState = "loading" | "ready" | "error";

export function TrialFunnelOpsPageClient(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_TRIAL_FUNNEL_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlPeriodDays = parseTrialFunnelPeriodDaysFromSearch(searchParams.get("range"));
  const urlStageFilter = parseTrialFunnelStageFromSearch(searchParams.get("stage"));
  const urlAttentionOnly = parseTrialFunnelAttentionOnlyFromSearch(searchParams.get("attention"));
  const urlComparePrevious = parseTrialFunnelComparePreviousFromSearch(searchParams.get("compare"));
  const urlSortKey = parseTrialFunnelCohortSortKeyFromSearch(searchParams.get("sort"));
  const urlSortAsc = parseTrialFunnelCohortSortAscFromSearch(searchParams.get("dir"));

  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [data, setData] = useState<TrialFunnelOperationalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [periodDays, setPeriodDays] = useState<TrialFunnelPeriodDays>(urlPeriodDays);
  const [comparePrevious, setComparePrevious] = useState(urlComparePrevious);
  const [stageFilter, setStageFilter] = useState<string>(urlStageFilter);
  const [attentionOnly, setAttentionOnly] = useState(urlAttentionOnly);
  const [sortKey, setSortKey] = useState<TrialFunnelCohortSortKey>(urlSortKey);
  const [sortAsc, setSortAsc] = useState(urlSortAsc);
  const [refreshAnnouncement, setRefreshAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    setPeriodDays(urlPeriodDays);
  }, [urlPeriodDays]);

  useEffect(() => {
    setStageFilter(urlStageFilter);
  }, [urlStageFilter]);

  useEffect(() => {
    setAttentionOnly(urlAttentionOnly);
  }, [urlAttentionOnly]);

  useEffect(() => {
    setComparePrevious(urlComparePrevious);
  }, [urlComparePrevious]);

  useEffect(() => {
    setSortKey(urlSortKey);
  }, [urlSortKey]);

  useEffect(() => {
    setSortAsc(urlSortAsc);
  }, [urlSortAsc]);

  const onComparePreviousChange = useCallback(
    (next: boolean) => {
      setComparePrevious(next);
      router.replace(trialFunnelCompareHrefFromSearch(currentSearch, next, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

  const onAttentionOnlyChange = useCallback(
    (next: boolean) => {
      setAttentionOnly(next);
      router.replace(trialFunnelAttentionHrefFromSearch(currentSearch, next, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

  const onSortKeyChange = useCallback(
    (next: TrialFunnelCohortSortKey) => {
      setSortKey(next);
      router.replace(trialFunnelCohortSortHrefFromSearch(currentSearch, next, sortAsc, pathname), { scroll: false });
    },
    [currentSearch, pathname, router, sortAsc],
  );

  const onSortAscChange = useCallback(
    (next: boolean) => {
      setSortAsc(next);
      router.replace(trialFunnelCohortSortHrefFromSearch(currentSearch, sortKey, next, pathname), { scroll: false });
    },
    [currentSearch, pathname, router, sortKey],
  );

  const onPeriodDaysChange = useCallback(
    (next: TrialFunnelPeriodDays) => {
      setPeriodDays(next);
      router.replace(trialFunnelPeriodHrefFromSearch(currentSearch, next, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

  const onStageFilterChange = useCallback(
    (next: string) => {
      setStageFilter(next);
      router.replace(trialFunnelStageHrefFromSearch(currentSearch, next, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

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
            <FilterChipGroup aria-label="Trial funnel date range" className="flex flex-wrap gap-2">
              {TRIAL_FUNNEL_PERIOD_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  href={trialFunnelPeriodHrefFromSearch(currentSearch, option.value, pathname)}
                  scroll={false}
                  className={buyerFilterChipClass(periodDays === option.value, loadState === "loading")}
                  aria-current={periodDays === option.value ? "page" : undefined}
                  disabled={loadState === "loading"}
                  data-testid={`trial-funnel-period-${option.value}`}
                  onClick={() => onPeriodDaysChange(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
            <label className={cn("inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(event) => onComparePreviousChange(event.target.checked)}
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

      <TrialFunnelOverviewSection data={data} loadState={loadState} maxStageCount={maxStageCount} />

      <TrialFunnelCohortTable
        data={data}
        loadState={loadState}
        periodDays={periodDays}
        currentSearch={currentSearch}
        pathname={pathname}
        filteredCohortRows={filteredCohortRows}
        stageFilter={stageFilter}
        setStageFilter={onStageFilterChange}
        attentionOnly={attentionOnly}
        setAttentionOnly={onAttentionOnlyChange}
        sortKey={sortKey}
        setSortKey={onSortKeyChange}
        sortAsc={sortAsc}
        setSortAsc={onSortAscChange}
      />
    </OperatorPageContainer>
  );
}
