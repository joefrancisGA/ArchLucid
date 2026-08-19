"use client";

import { useCallback, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getGovernanceResolution } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import type { GovernanceResolutionPageServerLoad } from "./load-governance-resolution-page-data";

export function useGovernanceResolutionPage(
  serverLoad: GovernanceResolutionPageServerLoad,
): GovernanceResolutionPageViewModel {
  /** Same Execute floor as Policy packs / Workflow writes — shapes refresh-section emphasis only (Refresh stays allowed). */
  const canMutateEnterprisePolicySurfaces = useOperateCapability();
  const [data, setData] = useState<EffectiveGovernanceResolutionResult | null>(serverLoad.data);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(serverLoad.failure);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(
    serverLoad.failure === null && serverLoad.data !== null ? new Date() : null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const r = await getGovernanceResolution();
      setData(r);
      setLastRefreshedAt(new Date());
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    buyerPolishedShell: isBuyerPolishedOperatorShellEnv(),
    canMutateEnterprisePolicySurfaces,
    data,
    loading,
    failure,
    lastRefreshedAt,
    load,
  };
}
