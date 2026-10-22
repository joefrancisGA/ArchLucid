"use client";

import {
  fetchTenantIdentityProviderConfiguration,
  type TenantIdentityProviderConfigurationRecord,
} from "@/lib/admin-identity-provider-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useTenantIdentityProviderConfigurationQuery() {
  return createOperatorQueryHook<TenantIdentityProviderConfigurationRecord | null>({
    queryKey: operatorQueryKeys.tenantIdentityProviderConfiguration,
    queryFn: fetchTenantIdentityProviderConfiguration,
  });
}
