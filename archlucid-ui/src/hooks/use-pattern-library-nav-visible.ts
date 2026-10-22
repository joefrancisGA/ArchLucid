"use client";

import { useQuery } from "@tanstack/react-query";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isBrowser } from "@/lib/api/http";
import { fetchPatternLibraryInsightCards } from "@/lib/fetch-pattern-library-insight-cards-client";
import { isPatternLibraryAggregateThresholdMet } from "@/lib/pattern-library-aggregate-threshold";
import { shouldSkipArchitectureOnlyProxyApi } from "@/lib/product-line/architecture-only-proxy-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** True when live anonymized aggregates meet the privacy threshold for sidebar/palette exposure. */
export function usePatternLibraryNavVisible(): boolean {
  const { productLine } = useProductLine();
  const skipArchitectureOnlyApi = shouldSkipArchitectureOnlyProxyApi(productLine);

  const { data, isSuccess } = useQuery({
    queryKey: operatorQueryKeys.patternLibraryInsightCards,
    queryFn: fetchPatternLibraryInsightCards,
    enabled: isBrowser() && !skipArchitectureOnlyApi,
    staleTime: 5 * 60 * 1000,
  });

  if (!isSuccess) {
    return false;
  }

  return isPatternLibraryAggregateThresholdMet(data ?? []);
}
