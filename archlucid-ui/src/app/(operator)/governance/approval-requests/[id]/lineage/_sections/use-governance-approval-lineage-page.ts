"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { getApprovalRequestLineage } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

import { resolveApprovalRequestIdFromParams } from "./resolve-approval-request-id-from-params";

export type UseGovernanceApprovalLineagePageModel = {
  approvalRequestId: string;
  buyerPolishedShell: boolean;
  data: GovernanceLineageResult | null;
  failure: ApiLoadFailureState | null;
  load: () => Promise<void>;
  loading: boolean;
  nextDemo: boolean;
};

export function useGovernanceApprovalLineagePage(): UseGovernanceApprovalLineagePageModel {
  const params = useParams<{ id: string }>();
  const approvalRequestId = resolveApprovalRequestIdFromParams(params);

  const [data, setData] = useState<GovernanceLineageResult | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(true);

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
      setData(null);
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [approvalRequestId]);

  useEffect(() => {
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
