"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { resolveSecureNowSuccessfulCaptureCount } from "@/lib/product-line/resolve-securenow-successful-capture-count";

export function useSecureNowSuccessfulCaptureCount(enabled: boolean): number | null {
  const scope = useOperatorScopeQueryKey();
  const query = useQuery({
    queryKey: ["securenow", "successful-capture-count", scope],
    queryFn: resolveSecureNowSuccessfulCaptureCount,
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  if (!enabled || query.isPending) {
    return null;
  }

  return query.data ?? 0;
}
