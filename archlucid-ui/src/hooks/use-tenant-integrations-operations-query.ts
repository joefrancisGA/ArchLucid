"use client";

import { fetchTenantIntegrationsOperations } from "@/lib/api/tenant-customer-success";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useTenantIntegrationsOperationsQuery() {
  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.tenantIntegrationsOperations,
    queryFn: fetchTenantIntegrationsOperations,
  });
}
