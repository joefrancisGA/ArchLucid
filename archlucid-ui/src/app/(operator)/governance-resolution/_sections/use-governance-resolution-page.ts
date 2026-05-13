"use client";

import { useCallback, useEffect, useState } from "react";

import { getGovernanceResolution } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

export function useGovernanceResolutionPage(): GovernanceResolutionPageViewModel {
  /** Same Execute floor as Policy packs / Workflow writes — shapes “Change related controls” emphasis only (GET refresh stays allowed). */
  const canMutateEnterprisePolicySurfaces = useEnterpriseMutationCapability();
  const [data, setData] = useState<EffectiveGovernanceResolutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const r = await getGovernanceResolution();
      setData(r);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    canMutateEnterprisePolicySurfaces,
    data,
    loading,
    failure,
    load,
  };
}
