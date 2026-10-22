/**
 * TB-2288 — Mid-session scope-change consequence banner.
 *
 * After the operator applies a tenant / workspace / project switch, lists and hubs
 * follow the new selection. An empty list may mean the wrong scope is selected —
 * not that data is missing.
 *
 * Distinct from the first-open hierarchy coach (TB-2234). Dismiss is keyed to the
 * current change event (sessionStorage) so a later switch can show again.
 */

import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

export const SCOPE_CHANGE_CONSEQUENCE_DISMISS_KEY_PREFIX =
  "archlucid_scope_change_consequence_dismissed_v1:" as const;

export type ScopeChangeConsequenceBannerModel = {
  readonly heading: string;
  readonly lead: string;
  readonly honesty: string;
  readonly dismissLabel: string;
};

export const SCOPE_CHANGE_CONSEQUENCE_HEADING = "Scope updated" as const;

export const SCOPE_CHANGE_CONSEQUENCE_LEAD =
  "Lists and hubs now follow this tenant, workspace, and project selection." as const;

export const SCOPE_CHANGE_CONSEQUENCE_HONESTY =
  "An empty list may mean the wrong scope is selected — not that data is missing." as const;

export const SCOPE_CHANGE_CONSEQUENCE_DISMISS_LABEL = "Dismiss" as const;

/** Stable key for the current scope change event (IDs only). */
export function buildScopeChangeEventKey(record: OperatorScopeRecord | null): string {
  if (record === null) {
    return "cleared";
  }

  return `${record.tenantId.trim()}|${record.workspaceId.trim()}|${record.projectId.trim()}`;
}

function dismissStorageKey(eventKey: string): string {
  return `${SCOPE_CHANGE_CONSEQUENCE_DISMISS_KEY_PREFIX}${eventKey}`;
}

/** Full banner copy model. */
export function buildScopeChangeConsequenceBanner(): ScopeChangeConsequenceBannerModel {
  return {
    heading: SCOPE_CHANGE_CONSEQUENCE_HEADING,
    lead: SCOPE_CHANGE_CONSEQUENCE_LEAD,
    honesty: SCOPE_CHANGE_CONSEQUENCE_HONESTY,
    dismissLabel: SCOPE_CHANGE_CONSEQUENCE_DISMISS_LABEL,
  };
}

/** True when the operator dismissed the banner for this change event (this session). */
export function isScopeChangeConsequenceDismissed(eventKey: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.sessionStorage.getItem(dismissStorageKey(eventKey)) === "1";
  } catch {
    return true;
  }
}

/** Persist dismiss for the current change event only (sessionStorage). */
export function dismissScopeChangeConsequence(eventKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(dismissStorageKey(eventKey), "1");
  } catch {
    /* private mode */
  }
}
