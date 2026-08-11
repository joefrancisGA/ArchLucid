"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PatternLibraryPolicyPacksVocabularyRail } from "@/components/PatternLibraryPolicyPacksVocabularyRail";
import { Badge } from "@/components/ui/badge";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PatternLibraryFiltersPanel } from "./PatternLibraryFiltersPanel";
import { PatternLibraryPatternCard } from "./PatternLibraryPatternCard";
import { PatternLibrarySummaryRow } from "./PatternLibrarySummaryRow";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PATTERN_LIBRARY_EMPTY_BUILDING_BODY,
  PATTERN_LIBRARY_EMPTY_BUILDING_TITLE,
  PATTERN_LIBRARY_EMPTY_FILTERED_BODY,
  PATTERN_LIBRARY_EMPTY_FILTERED_TITLE,
  PATTERN_LIBRARY_PAGE_SUBTITLE,
  PATTERN_LIBRARY_PAGE_TITLE,
  PATTERN_LIBRARY_WHAT_IS_PATTERN,
} from "@/lib/pattern-library-copy";
import {
  DEFAULT_PATTERN_LIBRARY_FILTERS,
  derivePatternLibrarySummary,
  filterPatternLibraryRecords,
  resolvePatternLibraryRecords,
} from "@/lib/pattern-library-filters";
import type { PatternLibraryFiltersState } from "@/lib/pattern-library-types";
import { usePatternLibraryProvenance } from "@/lib/use-pattern-library-provenance";
import { cn } from "@/lib/utils";

export function PatternLibraryPageClient(): React.JSX.Element {
  const [filters, setFilters] = useState<PatternLibraryFiltersState>(DEFAULT_PATTERN_LIBRARY_FILTERS);
  const {
    provenance,
    usingLiveAggregate,
    useSampleCatalog,
    eligiblePatternKeys,
    isPending,
    isError,
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
  const summary = useMemo(() => derivePatternLibrarySummary(allRecords), [allRecords]);
  const errorMessage = isError
    ? (error instanceof Error ? error.message : "Failed to load patterns.")
    : null;

  return (
    <div className={cn("w-full max-w-6xl", OPERATOR_LAYOUT.majorSectionGap)} data-testid="pattern-library-page">
      <OperatorPageHeader
        title={PATTERN_LIBRARY_PAGE_TITLE}
        subtitle={PATTERN_LIBRARY_PAGE_SUBTITLE}
        titleTestId="pattern-library-page-title"
        actions={<PageContextualHelpButton />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" data-testid="pattern-library-provenance-badge">
            {provenance.badgeLabel}
          </Badge>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{PATTERN_LIBRARY_WHAT_IS_PATTERN}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{provenance.notice}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.micro)}>{provenance.privacyNote}</p>
        </div>
      </OperatorPageHeader>
      <PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="pattern-library" />
      <PatternLibrarySummaryRow summary={summary} />

      <PatternLibraryFiltersPanel filters={filters} onChange={setFilters} />

      {isPending ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading pattern intelligence…</p> : null}

      {errorMessage ? (
        <p
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {!isPending && filteredRecords.length === 0 ? (
        <EnterpriseCompactEmptyState
          testId="pattern-library-empty-state"
          title={allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_TITLE : PATTERN_LIBRARY_EMPTY_FILTERED_TITLE}
          description={allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_BODY : PATTERN_LIBRARY_EMPTY_FILTERED_BODY}
          actions={[
            { label: "Start architecture review", href: "/architecture/reviews/new", variant: "primary" },
            { label: "Open completed sample", href: "/architecture/reviews/claims-intake-modernization", variant: "outline" },
          ]}
        />
      ) : null}

      {!isPending && filteredRecords.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2" data-testid="pattern-library-card-grid">
          {filteredRecords.map((record) => (
            <PatternLibraryPatternCard key={record.patternKey} record={record} />
          ))}
        </div>
      ) : null}

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Need a guided first review?{" "}
        <Link href="/help/getting-started" className="font-medium text-teal-700 underline dark:text-teal-400">
          Open Getting started
        </Link>
      </p>
    </div>
  );
}
