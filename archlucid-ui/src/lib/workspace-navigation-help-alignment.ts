import {
  OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY,
  OPERATE_NAV_UNLOCK_CHANGED_EVENT,
  OPERATE_NAV_UNLOCK_STORAGE_KEY,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Canonical buyer-facing doc for workspace navigation (folded into pilot-guide). */
export const WORKSPACE_NAVIGATION_GUIDE_DOC_PATH =
  "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md";

/** In-app help route for workspace navigation guidance (PIL → HP fold). */
export const WORKSPACE_NAVIGATION_HELP_HREF = "/help/pilot-guide";

/** Operate nav groups hidden entirely until unlock phase ≥ 1. */
export const PILOT_NAV_OPERATE_GROUP_IDS = [
  "operate-analysis",
  "operate-architect-advanced",
  "operate-governance",
  "operate-policy",
  "operate-integrations",
] as const;

/** Sidebar surfaces that must wire the role-density expand control (desktop + mobile parity). */
export const PILOT_NAV_REQUIRED_SHELL_COMPONENTS = ["RoleNavDensityExpandControl"] as const;

/** Test ids owned by role-density sidebar escape hatch UI. */
export const PILOT_NAV_REQUIRED_UI_TEST_IDS = ["role-nav-density-expand-toggle"] as const;

/** Storage keys that must remain stable for E2E and auto-unlock after first commit. */
export const PILOT_NAV_STORAGE_KEYS = [
  OPERATE_NAV_UNLOCK_STORAGE_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY,
] as const;

export const PILOT_NAV_UNLOCK_CHANGED_EVENT = OPERATE_NAV_UNLOCK_CHANGED_EVENT;
