"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  fetchCorePilotCommitContext,
  resolveCorePilotCommitContextFromRunItems,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { subscribeOperatorHomeLifecycleRefresh } from "@/lib/operator/operator-home-lifecycle-notify";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunSummary } from "@/types/authority";

type UseCorePilotCommitContextQueryOptions = {
  readonly enabled?: boolean;
  /** When provided, skips the paged runs list fetch and derives context from SSR/home data. */
  readonly seedRunItems?: readonly RunSummary[] | undefined;
};

export function useCorePilotCommitContextQuery(options?: UseCorePilotCommitContextQueryOptions) {
  const queryClient = useQueryClient();
  const seedRunItems = options?.seedRunItems;
  const hasSeed = seedRunItems !== undefined;

  useEffect(() => {
    return subscribeOperatorHomeLifecycleRefresh(() => {
      void queryClient.refetchQueries({ queryKey: operatorQueryKeys.corePilotCommitContext });
    });
  }, [queryClient]);

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
