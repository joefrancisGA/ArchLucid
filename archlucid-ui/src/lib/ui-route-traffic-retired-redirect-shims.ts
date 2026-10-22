import { LEGACY_QUICK_START_PATH } from "@/lib/legacy-quick-start-route";

/** Retired traffic workbook row IDs for legacy redirect-only bookmarks (IA batch 4). */
export const REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS = [
  "AAX",
  "AL2",
  "EDA",
  "LOG",
  "OXX",
  "OSX",
  "OAX",
  "QUI",
] as const;

/** Retired `/login` bookmark — no App Router page or next.config redirect. */
export const RETIRED_LOGIN_BOOKMARK_PATH = "/login" as const;

/** Retired `/onboard` bookmark — no App Router page or next.config redirect. */
export const RETIRED_ONBOARD_BOOKMARK_PATH = "/onboard" as const;

/** Retired `/onboarding/start` bookmark — no App Router page or next.config redirect. */
export const RETIRED_ONBOARDING_START_BOOKMARK_PATH = "/onboarding/start" as const;

/** Retired `/operate/architecture-graph` bookmark — no App Router page or next.config redirect. */
export const RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH = "/operate/architecture-graph" as const;

/** Legacy bookmark paths — no live App Router page or next.config redirect. */
export const RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS = [
  RETIRED_LOGIN_BOOKMARK_PATH,
  RETIRED_ONBOARD_BOOKMARK_PATH,
  RETIRED_ONBOARDING_START_BOOKMARK_PATH,
  RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH,
  LEGACY_QUICK_START_PATH,
] as const;

/** Canonical operator sign-in scored on traffic row ASI. */
export const CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH = "/auth/signin" as const;
