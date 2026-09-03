import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

import {
  defaultAuditTrailViewMode,
  type AuditTrailViewMode,
} from "@/lib/audit-trail-view-mode";

export const AUDIT_TRAIL_VIEW_PARAM = "view";

const VIEW_MODE_IDS = new Set<string>(["story", "table"]);

export function parseAuditTrailViewModeFromSearch(
  raw: string | null | undefined,
  buyerPolishedShell: boolean,
): AuditTrailViewMode {
  if (raw === null || raw === undefined) {
    return defaultAuditTrailViewMode(buyerPolishedShell);
  }

  const trimmed = raw.trim();

  if (!VIEW_MODE_IDS.has(trimmed)) {
    return defaultAuditTrailViewMode(buyerPolishedShell);
  }

  return trimmed as AuditTrailViewMode;
}

export function auditTrailViewModeHrefFromSearch(
  currentSearch: string,
  viewMode: AuditTrailViewMode,
  buyerPolishedShell: boolean,
  pathname: string = GOVERNANCE_AUDIT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const defaultMode = defaultAuditTrailViewMode(buyerPolishedShell);

  if (viewMode === defaultMode) {
    params.delete(AUDIT_TRAIL_VIEW_PARAM);
  } else {
    params.set(AUDIT_TRAIL_VIEW_PARAM, viewMode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
