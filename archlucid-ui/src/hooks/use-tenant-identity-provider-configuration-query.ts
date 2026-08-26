"use client";

import {
  fetchTenantIdentityProviderConfiguration,
  type TenantIdentityProviderConfigurationRecord,
} from "@/lib/admin-identity-provider-api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useTenantIdentityProviderConfigurationQuery() {
  return useOperatorQueryHook<TenantIdentityProviderConfigurationRecord | null>({
    queryKey: operatorQueryKeys.tenantIdentityProviderConfiguration,
    queryFn: fetchTenantIdentityProviderConfiguration,
  });
}
