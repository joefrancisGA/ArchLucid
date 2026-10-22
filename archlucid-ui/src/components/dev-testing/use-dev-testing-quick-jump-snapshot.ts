import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { isDevTestingOverridesEnabled } from "@/lib/dev-testing-overrides";
import {
  buildEmptyDevTestingQuickJumpSnapshot,
  loadDevTestingQuickJumpSnapshot,
  type DevTestingQuickJumpSnapshot,
} from "@/lib/load-dev-testing-quick-jump-snapshot";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

function normalizeRunIds(runIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of runIds) {
    const trimmed = raw.trim();

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function useDevTestingQuickJumpSnapshot(runIds: readonly string[]): {
  readonly snapshot: DevTestingQuickJumpSnapshot;
  readonly loading: boolean;
} {
  const normalizedRunIds = useMemo(() => normalizeRunIds(runIds), [runIds]);
  const runIdsKey = useMemo(() => normalizedRunIds.join("|"), [normalizedRunIds]);
  const devEnabled = isDevTestingOverridesEnabled();

  const query = useQuery({
    queryKey: operatorQueryKeys.devTestingQuickJumpSnapshot(runIdsKey),
    queryFn: () => loadDevTestingQuickJumpSnapshot(normalizedRunIds),
    enabled: devEnabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const snapshot = useMemo(() => {
    if (!devEnabled) {
      return buildEmptyDevTestingQuickJumpSnapshot(normalizedRunIds);
    }

    return query.data ?? buildEmptyDevTestingQuickJumpSnapshot(normalizedRunIds);
  }, [devEnabled, normalizedRunIds, query.data]);

  return {
    snapshot,
    loading: devEnabled && query.isPending,
  };
}
