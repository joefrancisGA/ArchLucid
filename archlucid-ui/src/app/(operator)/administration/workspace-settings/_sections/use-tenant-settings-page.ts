"use client";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

export function useTenantSettingsPage(): TenantSettingsPageContentModel {
  const { callerAuthorityRank, currentPrincipal } = useOperatorNavAuthority();
  const trialQuery = useTenantTrialStatusQuery();

  // Tenant-scoped configuration is admin-only; the API is authoritative and gates the same writes.
  const isTenantAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  return {
    currentPrincipalName: currentPrincipal.name ?? null,
    tenantDisplayName: readActiveTenantContext().displayName,
    callerAuthorityRank,
    isTenantAdmin,
    trial: trialQuery.data ?? null,
  };
}
