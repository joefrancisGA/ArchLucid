"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchCorePilotCommitContext,
  resolveCorePilotCommitContextFromRunItems,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunSummary } from "@/types/authority";

type UseCorePilotCommitContextQueryOptions = {
  readonly enabled?: boolean;
  /** When provided, skips the paged runs list fetch and derives context from SSR/home data. */
  readonly seedRunItems?: readonly RunSummary[] | undefined;
};

export function useCorePilotCommitContextQuery(options?: UseCorePilotCommitContextQueryOptions) {
  const seedRunItems = options?.seedRunItems;
  const hasSeed = seedRunItems !== undefined;

  return useQuery<CorePilotCommitContext>({
    queryKey: operatorQueryKeys.corePilotCommitContext,
    queryFn: () =>
      hasSeed
        ? resolveCorePilotCommitContextFromRunItems(seedRunItems)
        : fetchCorePilotCommitContext(),
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
