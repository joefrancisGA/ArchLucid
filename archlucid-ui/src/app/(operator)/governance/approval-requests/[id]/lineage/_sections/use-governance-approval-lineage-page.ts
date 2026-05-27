"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getApprovalRequestLineage } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { tryStaticDemoGovernanceApprovalLineage } from "@/lib/operator-static-demo";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

import type { GovernanceApprovalLineagePageServerLoad } from "./load-governance-approval-lineage-page-data";

export type UseGovernanceApprovalLineagePageModel = {
  approvalRequestId: string;
  buyerPolishedShell: boolean;
  data: GovernanceLineageResult | null;
  failure: ApiLoadFailureState | null;
  load: () => Promise<void>;
  loading: boolean;
  nextDemo: boolean;
};

export function useGovernanceApprovalLineagePage(
  loaded: GovernanceApprovalLineagePageServerLoad,
): UseGovernanceApprovalLineagePageModel {
  const approvalRequestId = loaded.approvalRequestId;

  const [data, setData] = useState<GovernanceLineageResult | null>(loaded.data);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(loaded.failure);
  const [loading, setLoading] = useState(false);

  const skipInitialClientFetchRef = useRef(true);

  const load = useCallback(async () => {
    if (!approvalRequestId) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const result = await getApprovalRequestLineage(approvalRequestId);

      setData(result);
    } catch (e: unknown) {
      const fallback = tryStaticDemoGovernanceApprovalLineage(approvalRequestId);

      if (fallback !== null) {
        setData(fallback);

        return;
      }

      setData(null);
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [approvalRequestId]);

  useEffect(() => {
    if (skipInitialClientFetchRef.current) {
      skipInitialClientFetchRef.current = false;

      return;
    }

    void load();
  }, [load]);

  return {
    approvalRequestId,
    buyerPolishedShell: isBuyerPolishedOperatorShellEnv(),
    data,
    failure,
    load,
    loading,
    nextDemo: isNextPublicDemoMode(),
  };
}
