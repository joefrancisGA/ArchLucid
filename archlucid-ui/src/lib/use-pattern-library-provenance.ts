"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPatternLibraryInsightCards } from "@/lib/fetch-pattern-library-insight-cards-client";
import {
  filterEligiblePatternInsightCards,
  isPatternLibraryAggregateThresholdMet,
} from "@/lib/pattern-library-aggregate-threshold";
import {
  resolvePatternLibraryProvenance,
  shouldUsePatternLibrarySampleCatalogWhenBelowThreshold,
} from "@/lib/pattern-library-provenance";
import type { PatternLibraryProvenance } from "@/lib/pattern-library-types";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type PatternLibraryProvenanceState = {
  readonly provenance: PatternLibraryProvenance;
  readonly usingLiveAggregate: boolean;
  readonly useSampleCatalog: boolean;
  readonly eligiblePatternKeys: readonly string[];
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
};

/** Shared hub + detail provenance resolution (TB-1811). */
export function usePatternLibraryProvenance(): PatternLibraryProvenanceState {
  const { data: insightCards, isPending, isFetching, isError, error } = useQuery({
    queryKey: operatorQueryKeys.patternLibraryInsightCards,
    queryFn: fetchPatternLibraryInsightCards,
  });

  const eligibleCards = useMemo(
    () => filterEligiblePatternInsightCards(insightCards ?? []),
    [insightCards],
  );
  const eligiblePatternKeys = useMemo(
    () => eligibleCards.map((card) => card.patternKey),
    [eligibleCards],
  );
  const usingLiveAggregate = isPatternLibraryAggregateThresholdMet(insightCards);
  const useSampleCatalog = !usingLiveAggregate && shouldUsePatternLibrarySampleCatalogWhenBelowThreshold();
  const provenance = resolvePatternLibraryProvenance(usingLiveAggregate);

  return {
    provenance,
    usingLiveAggregate,
    useSampleCatalog,
    eligiblePatternKeys,
    isPending,
    isFetching,
    isError,
    error: error instanceof Error ? error : null,
  };
}
