import {
  OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY,
  OPERATE_NAV_UNLOCK_CHANGED_EVENT,
  OPERATE_NAV_UNLOCK_STORAGE_KEY,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Canonical buyer-facing doc for pilot nav progressive disclosure (Tier 2 #5). */
export const PILOT_NAV_PROFILE_DOC_PATH = "docs/library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md";

/** In-app help route for the pilot nav profile. */
export const PILOT_NAV_PROFILE_HELP_HREF = "/help/pilot-guide";

/** Operate nav groups hidden entirely until unlock phase ≥ 1. */
export const PILOT_NAV_OPERATE_GROUP_IDS = [
  "operate-analysis",
  "operate-architect-advanced",
  "operate-governance",
  "operate-integrations",
] as const;

/** Sidebar surfaces that must wire the pilot nav unlock contract. */
export const PILOT_NAV_REQUIRED_SHELL_COMPONENTS = [
  "OperateFeaturesUnlockPanel",
  "OperateUnlockAutoHint",
] as const;

/** Test ids owned by pilot nav unlock UI (defined on child components). */
export const PILOT_NAV_REQUIRED_UI_TEST_IDS = [
  "operate-features-unlock-panel",
  "nav-advanced-unlock",
  "operate-unlock-auto-hint",
  "pilot-nav-profile-help-link",
] as const;

/** Storage keys that must remain stable for E2E and auto-unlock after first commit. */
export const PILOT_NAV_STORAGE_KEYS = [
  OPERATE_NAV_UNLOCK_STORAGE_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_PENDING_KEY,
  OPERATE_NAV_AUTO_UNLOCK_HINT_DISMISSED_KEY,
] as const;

export const PILOT_NAV_UNLOCK_CHANGED_EVENT = OPERATE_NAV_UNLOCK_CHANGED_EVENT;
