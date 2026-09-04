import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_QUICK_APPROVE_ID_PARAM = "quickApproveId";

export function parseGovernanceQuickApproveIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceQuickApproveConfirmHrefFromSearch(
  currentSearch: string,
  approvalRequestId: string | null,
  pathname: string = GOVERNANCE_APPROVAL_QUEUE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (approvalRequestId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_QUICK_APPROVE_ID_PARAM);
  } else {
    params.set(GOVERNANCE_QUICK_APPROVE_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
