import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

/** Reviews hub inventory — header search drives `?q=` on this path only. */
export function isReviewsHubInventoryHeaderSearchPath(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0]?.replace(/\/$/, "") ?? "";

  return path === "/architecture/reviews";
}

/** Findings queue — header search drives `?q=` on tenant and assigned-to-me queues. */
export function isGovernanceFindingsQueueHeaderSearchPath(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0]?.replace(/\/$/, "") ?? "";

  return path === GOVERNANCE_FINDINGS_PATH || path === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH;
}
