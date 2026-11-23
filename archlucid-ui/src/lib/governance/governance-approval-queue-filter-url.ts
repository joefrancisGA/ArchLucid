import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  governanceApprovalQueueHref,
} from "@/lib/governance/governance-route-paths";

import {
  GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM,
  type GovernanceApprovalStatusFilter,
} from "./governance-approval-status-filter";

export function governanceApprovalQueueFilterHrefFromSearch(
  searchParams: URLSearchParams,
  patch: { readonly approvalStatus?: GovernanceApprovalStatusFilter | null; readonly runId?: string | null } = {},
): string {
  return buildOperatorHrefFromSearch(searchParams.toString(), GOVERNANCE_APPROVAL_QUEUE_PATH, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
      if (patch.runId !== undefined) {
        const trimmedRunId = patch.runId?.trim() ?? "";

        if (trimmedRunId.length === 0) {
          params.delete("runId");
        } else {
          params.set("runId", trimmedRunId);
        }
      }

      if (patch.approvalStatus !== undefined) {
        if (patch.approvalStatus === null) {
          params.delete(GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM);
        } else {
          params.set(GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM, patch.approvalStatus);
        }
      }
    },
  });
}

export function governanceApprovalQueueStatusFilterHref(
  runId: string | null,
  approvalStatus: GovernanceApprovalStatusFilter | null,
): string {
  const base = governanceApprovalQueueHref(runId);
  const params = new URLSearchParams();

  if (runId !== null && runId.trim().length > 0) {
    params.set("runId", runId.trim());
  }

  if (approvalStatus !== null) {
    params.set(GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM, approvalStatus);
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_APPROVAL_QUEUE_PATH : `${GOVERNANCE_APPROVAL_QUEUE_PATH}?${query}`;
}