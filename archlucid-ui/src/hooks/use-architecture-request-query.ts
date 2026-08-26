"use client";

import { getArchitectureRequest } from "@/lib/api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseArchitectureRequestQueryOptions = {
  readonly enabled?: boolean;
};

export function useArchitectureRequestQuery(
  requestId: string,
  options?: UseArchitectureRequestQueryOptions,
) {
  const trimmed = requestId.trim();

  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.architectureRequest(trimmed),
    queryFn: () => getArchitectureRequest(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
