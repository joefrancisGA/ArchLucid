import { LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";
import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";
import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";
import { LEGACY_QUICK_START_PATH } from "@/lib/legacy-quick-start-route";

/** Retired traffic workbook row IDs for legacy redirect-only bookmarks (IA batch 4). */
export const REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS = [
  "OXX",
  "OSX",
  "OAX",
  "QUI",
] as const;

/** Legacy bookmark paths — no live App Router page or next.config redirect. */
export const RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS = [
  LEGACY_ONBOARD_PATH,
  LEGACY_ONBOARDING_START_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
  LEGACY_QUICK_START_PATH,
] as const;
