import { useQuery } from "@tanstack/react-query";

import { fetchTenantWorkOwnershipDeletePolicy } from "@/lib/tenant-work-ownership-delete-policy-client";

type UseWorkOwnershipDeletePolicyQueryOptions = {
  readonly enabled?: boolean;
};

export function useWorkOwnershipDeletePolicyQuery(options?: UseWorkOwnershipDeletePolicyQueryOptions) {
  return useQuery({
    queryKey: ["tenant-work-ownership-delete-policy"],
    queryFn: fetchTenantWorkOwnershipDeletePolicy,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
