"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { PatternLibraryPolicyPacksVocabularyRail } from "@/components/PatternLibraryPolicyPacksVocabularyRail";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PATTERN_LIBRARY_EMPTY_BUILDING_BODY,
  PATTERN_LIBRARY_EMPTY_BUILDING_TITLE,
  PATTERN_LIBRARY_EMPTY_FILTERED_BODY,
  PATTERN_LIBRARY_EMPTY_FILTERED_TITLE,
  PATTERN_LIBRARY_LOAD_RETRY_LABEL,
  patternLibraryPageSubtitle,
} from "@/lib/pattern-library-copy";
import {
  DEFAULT_PATTERN_LIBRARY_FILTERS,
  derivePatternLibrarySummary,
  filterPatternLibraryRecords,
  resolvePatternLibraryRecords,
} from "@/lib/pattern-library-filters";
import type { PatternLibraryFiltersState } from "@/lib/pattern-library-types";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { resolveContinueLastPatternLibraryRecord } from "@/lib/resolve-continue-last-pattern-library-record";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { usePatternLibraryProvenance } from "@/lib/use-pattern-library-provenance";
import { cn } from "@/lib/utils";

import { PatternLibraryBuyerChrome } from "./PatternLibraryBuyerChrome";
import { PatternLibraryCatalogSkeleton } from "./PatternLibraryCatalogSkeleton";
import { PatternLibraryContinueLastViewedRow } from "./PatternLibraryContinueLastViewedRow";
import { PatternLibraryFiltersPanel } from "./PatternLibraryFiltersPanel";
import { PatternLibraryLoadFailurePanel } from "./PatternLibraryLoadFailurePanel";
import { PatternLibraryPageHeader } from "./PatternLibraryPageHeader";
import { PatternLibraryPatternCard } from "./PatternLibraryPatternCard";
import { PatternLibrarySummaryRow } from "./PatternLibrarySummaryRow";

function toPatternLibraryLoadFailure(error: Error): ApiLoadFailureState {
  return {
    message: error.message,
    problem: null,
    correlationId: null,
    httpStatus: null,
    retryAfterSeconds: null,
  };
}

export function PatternLibraryPageClient(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PatternLibraryFiltersState>(DEFAULT_PATTERN_LIBRARY_FILTERS);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const {
    provenance,
    usingLiveAggregate,
    useSampleCatalog,
    eligiblePatternKeys,
    isPending,
    isError,
    isFetching,
    error,
  } = usePatternLibraryProvenance();
  const allRecords = useMemo(
    () => resolvePatternLibraryRecords(
      usingLiveAggregate ? eligiblePatternKeys : [],
      useSampleCatalog,
    ),
    [eligiblePatternKeys, useSampleCatalog, usingLiveAggregate],
  );
  const filteredRecords = useMemo(() => filterPatternLibraryRecords(allRecords, filters), [allRecords, filters]);
  const continueLastPattern = useMemo(
    () => resolveContinueLastPatternLibraryRecord(allRecords),
    [allRecords],
  );
  const summary = useMemo(() => derivePatternLibrarySummary(allRecords), [allRecords]);
  const headerRefreshing = isPending || isFetching;
  const loadFailure = isError && error !== null ? toPatternLibraryLoadFailure(error) : null;

  const refreshCatalog = (): void => {
    void queryClient.invalidateQueries({ queryKey: operatorQueryKeys.patternLibraryInsightCards });
  };

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap} data-testid="pattern-library-page">
      <PatternLibraryPageHeader
        subtitle={patternLibraryPageSubtitle(buyerPolishedShell)}
        provenance={provenance}
        showProvenanceDetails={!buyerPolishedShell}
        refreshing={headerRefreshing}
        lastUpdatedUtc={summary.lastUpdatedUtc}
        onRefresh={refreshCatalog}
      />

      <PatternLibraryBuyerChrome />

      {!buyerPolishedShell ? (
        <PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="pattern-library" />
      ) : null}

      {isPending ? <PatternLibraryCatalogSkeleton /> : null}

      {!isPending && loadFailure !== null ? (
        <PatternLibraryLoadFailurePanel
          failure={loadFailure}
          retryLabel={PATTERN_LIBRARY_LOAD_RETRY_LABEL}
          testId="pattern-library-load-failure"
          retryTestId="pattern-library-load-retry"
          retryDisabled={headerRefreshing}
          onRetry={refreshCatalog}
        />
      ) : null}

      {!isPending && loadFailure === null ? (
        <>
          <PatternLibrarySummaryRow summary={summary} />
          {continueLastPattern !== null ? (
            <PatternLibraryContinueLastViewedRow record={continueLastPattern} />
          ) : null}
          <PatternLibraryFiltersPanel filters={filters} onChange={setFilters} />

          {filteredRecords.length === 0 ? (
            <EnterpriseCompactEmptyState
              testId="pattern-library-empty-state"
              title={allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_TITLE : PATTERN_LIBRARY_EMPTY_FILTERED_TITLE}
              description={
                allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_BODY : PATTERN_LIBRARY_EMPTY_FILTERED_BODY
              }
              actions={[
                { label: "Start architecture review", href: "/architecture/reviews/new", variant: "primary" },
                {
                  label: "Open completed sample",
                  href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
                  variant: "outline",
                },
              ]}
            />
          ) : null}

          {filteredRecords.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2" data-testid="pattern-library-card-grid">
              {filteredRecords.map((record) => (
                <PatternLibraryPatternCard key={record.patternKey} record={record} />
              ))}
            </div>
          ) : null}

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Need a guided first review?{" "}
            <Link href="/help/getting-started" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              Open Getting started
            </Link>
          </p>
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
