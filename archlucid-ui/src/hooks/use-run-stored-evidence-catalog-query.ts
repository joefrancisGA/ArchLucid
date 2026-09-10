"use client";

import { useQuery } from "@tanstack/react-query";

import { listRunStoredEvidenceFiles } from "@/lib/runs/run-stored-evidence-file-api";
import type { RunStoredEvidenceCatalogEntry } from "@/lib/runs/run-detail-evidence-inventory";

export function runStoredEvidenceCatalogQueryKey(runId: string): readonly [string, string] {
  return ["run-stored-evidence-catalog", runId];
}

export function useRunStoredEvidenceCatalogQuery(runId: string): {
  readonly catalog: readonly RunStoredEvidenceCatalogEntry[];
  readonly isLoading: boolean;
  readonly isError: boolean;
} {
  const query = useQuery({
    queryKey: runStoredEvidenceCatalogQueryKey(runId),
    queryFn: () => listRunStoredEvidenceFiles(runId),
    enabled: runId.trim().length > 0,
    staleTime: 30_000,
  });

  return {
    catalog: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
