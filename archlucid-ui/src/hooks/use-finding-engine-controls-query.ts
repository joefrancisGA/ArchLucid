import { useQuery } from "@tanstack/react-query";

import { fetchTenantFindingEngineControls } from "@/lib/tenant-finding-engine-controls-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseFindingEngineControlsQueryOptions = {
  enabled?: boolean;
};

export function useFindingEngineControlsQuery(options?: UseFindingEngineControlsQueryOptions) {
  return useQuery({
    queryKey: operatorQueryKeys.findingEngineControls,
    queryFn: fetchTenantFindingEngineControls,
    enabled: options?.enabled ?? true,
  });
}
