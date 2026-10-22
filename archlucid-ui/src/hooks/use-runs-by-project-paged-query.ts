"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import { fetchRunsByProjectPaged } from "@/lib/runs-by-project-paged-client";

export function useRunsByProjectPagedQuery(
  params: RunsByProjectPagedParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: operatorQueryKeys.runsByProjectPaged(params),
    queryFn: () => fetchRunsByProjectPaged(params),
    enabled: options?.enabled ?? true,
  });
}
