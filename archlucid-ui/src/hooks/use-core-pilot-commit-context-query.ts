"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchCorePilotCommitContext,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useCorePilotCommitContextQuery(options?: { enabled?: boolean }) {
  return useQuery<CorePilotCommitContext>({
    queryKey: operatorQueryKeys.corePilotCommitContext,
    queryFn: fetchCorePilotCommitContext,
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
