"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Badge } from "@/components/ui/badge";
import { PatternLibraryFiltersPanel } from "@/app/(operator)/patterns/_sections/PatternLibraryFiltersPanel";
import { PatternLibraryPatternCard } from "@/app/(operator)/patterns/_sections/PatternLibraryPatternCard";
import { PatternLibrarySummaryRow } from "@/app/(operator)/patterns/_sections/PatternLibrarySummaryRow";
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
import { resolvePatternLibraryProvenance } from "@/lib/pattern-library-provenance";
import type { PatternLibraryFiltersState } from "@/lib/pattern-library-types";
import { cn } from "@/lib/utils";

type ApiPatternInsightCard = {
  patternKey: string;
  industryVertical: string;
  summary: string;
  contributingTenantCount: number;
};

export function PatternLibraryPageClient(): React.JSX.Element {
  const [filters, setFilters] = useState<PatternLibraryFiltersState>(DEFAULT_PATTERN_LIBRARY_FILTERS);
  const [apiKeys, setApiKeys] = useState<readonly string[]>([]);
  const [usingLiveAggregate, setUsingLiveAggregate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/proxy/v1/analytics/patterns", {
          headers: { Accept: "application/json" },
        });
        const text = await res.text();

        if (!res.ok) {
          if (!cancelled) {
            setError(text.length > 0 ? text : `Request failed (${res.status})`);
          }

          return;
        }

        const parsed = text.length > 0 ? (JSON.parse(text) as ApiPatternInsightCard[]) : [];

        if (!cancelled) {
          const eligible = parsed.filter((card) => card.contributingTenantCount >= 5);
          setApiKeys(eligible.map((card) => card.patternKey));
          setUsingLiveAggregate(eligible.length >= 3);
        }
      } catch (ex) {
        if (!cancelled) {
          setError(ex instanceof Error ? ex.message : "Failed to load patterns.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const provenance = resolvePatternLibraryProvenance(usingLiveAggregate);
  const allRecords = useMemo(
    () => resolvePatternLibraryRecords(apiKeys, !usingLiveAggregate),
    [apiKeys, usingLiveAggregate],
  );
  const filteredRecords = useMemo(() => filterPatternLibraryRecords(allRecords, filters), [allRecords, filters]);
  const summary = useMemo(() => derivePatternLibrarySummary(allRecords), [allRecords]);

  return (
    <div className={cn("w-full max-w-6xl", OPERATOR_LAYOUT.majorSectionGap)} data-testid="pattern-library-page">
      <OperatorPageHeader title={PATTERN_LIBRARY_PAGE_TITLE} subtitle={PATTERN_LIBRARY_PAGE_SUBTITLE} titleTestId="pattern-library-page-title">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" data-testid="pattern-library-provenance-badge">
            {provenance.badgeLabel}
          </Badge>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{PATTERN_LIBRARY_WHAT_IS_PATTERN}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{provenance.notice}</p>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.micro)}>{provenance.privacyNote}</p>
        </div>
      </OperatorPageHeader>

      <PatternLibrarySummaryRow summary={summary} />

      <PatternLibraryFiltersPanel filters={filters} onChange={setFilters} />

      {loading ? <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading pattern intelligence…</p> : null}

      {error ? (
        <p
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && filteredRecords.length === 0 ? (
        <EnterpriseCompactEmptyState
          testId="pattern-library-empty-state"
          title={allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_TITLE : PATTERN_LIBRARY_EMPTY_FILTERED_TITLE}
          description={allRecords.length === 0 ? PATTERN_LIBRARY_EMPTY_BUILDING_BODY : PATTERN_LIBRARY_EMPTY_FILTERED_BODY}
          actions={[
            { label: "Start architecture review", href: "/reviews/new", variant: "primary" },
            { label: "Open completed sample", href: "/reviews/claims-intake-modernization", variant: "outline" },
          ]}
        />
      ) : null}

      {!loading && filteredRecords.length > 0 ? (
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
