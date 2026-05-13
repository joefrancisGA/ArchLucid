"use client";

import { useCallback, useState } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getGovernanceResolution } from "@/lib/api";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import type { GovernanceResolutionPageServerLoad } from "./load-governance-resolution-page-data";

export function useGovernanceResolutionPage(
  serverLoad: GovernanceResolutionPageServerLoad,
): GovernanceResolutionPageViewModel {
  /** Same Execute floor as Policy packs / Workflow writes — shapes “Change related controls” emphasis only (GET refresh stays allowed). */
  const canMutateEnterprisePolicySurfaces = useEnterpriseMutationCapability();
  const [data, setData] = useState<EffectiveGovernanceResolutionResult | null>(serverLoad.data);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(serverLoad.failure);

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

  return {
    canMutateEnterprisePolicySurfaces,
    data,
    loading,
    failure,
    load,
  };
}
