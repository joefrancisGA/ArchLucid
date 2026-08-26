"use client";

import { listAzureBoardsWorkItemTypes } from "@/lib/api/azure-boards-api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseAzureBoardsWorkItemTypesQueryOptions = {
  readonly enabled?: boolean;
};

export function useAzureBoardsWorkItemTypesQuery(
  projectName: string,
  options?: UseAzureBoardsWorkItemTypesQueryOptions,
) {
  const trimmed = projectName.trim();

  return useOperatorQueryHook<string[]>({
    queryKey: operatorQueryKeys.azureBoardsWorkItemTypes(trimmed),
    queryFn: () => listAzureBoardsWorkItemTypes(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
