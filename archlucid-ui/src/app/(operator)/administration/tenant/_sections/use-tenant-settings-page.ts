"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import { tryGetTenantTrialStatus } from "@/lib/api";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

import type { TenantSettingsVisibleLoad } from "./load-tenant-settings-page-data";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

export function useTenantSettingsPage(loaded: TenantSettingsVisibleLoad): TenantSettingsPageContentModel {
  const { callerAuthorityRank, currentPrincipal } = useOperatorNavAuthority();

  // Tenant-scoped configuration is admin-only; the API is authoritative and gates the same writes.
  const isTenantAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [trial, setTrial] = useState<TenantTrialStatusPayload | null>(loaded.trial);

  const skipInitialClientLoadRef = useRef(true);

  const load = useCallback(async () => {
    const nextTrial = await tryGetTenantTrialStatus();

    setTrial(nextTrial);
  }, []);

  useEffect(() => {
    // The server load already supplied trial status for the first paint; only refresh on later renders.
    if (skipInitialClientLoadRef.current) {
      skipInitialClientLoadRef.current = false;

      return;
    }

    void load();
  }, [load]);

  return {
    currentPrincipalName: currentPrincipal.name ?? null,
    tenantDisplayName: readActiveTenantContext().displayName,
    isTenantAdmin,
    trial,
  };
}
