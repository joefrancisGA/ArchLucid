"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listApprovalRequests } from "@/lib/api";
import { resolveNextApprovalRequest } from "@/lib/resolve-next-approval-request";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

import { GovernanceApprovalLineageNextRequestFooter } from "./GovernanceApprovalLineageNextRequestFooter";

export type GovernanceApprovalLineageNextRequestFooterClientProps = {
  readonly runId: string;
  readonly currentApprovalRequestId: string;
};

/** Loads the run-scoped approval queue and renders the next-request lineage footer. */
export function GovernanceApprovalLineageNextRequestFooterClient(
  props: GovernanceApprovalLineageNextRequestFooterClientProps,
): React.JSX.Element | null {
  const [approvals, setApprovals] = useState<readonly GovernanceApprovalRequest[]>([]);

  const loadApprovals = useCallback(async () => {
    const runId = props.runId.trim();

    if (runId.length === 0) {
      setApprovals([]);

      return;
    }

    try {
      setApprovals(await listApprovalRequests(runId));
    } catch {
      setApprovals([]);
    }
  }, [props.runId]);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  const nextRequest = useMemo(
    () => resolveNextApprovalRequest(approvals, props.currentApprovalRequestId),
    [approvals, props.currentApprovalRequestId],
  );

  if (nextRequest === null) {
    return null;
  }

  return <GovernanceApprovalLineageNextRequestFooter target={nextRequest} />;
}
