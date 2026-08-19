import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_USERS_PATH,
} from "@/lib/settings-admin-route-paths";

export const SETTINGS_HUB_CANONICAL_PATH = SETTINGS_ROOT_PATH;

export const SETTINGS_HUB_FOLLOW_UPS_TITLE = "Where to go next";

export const SETTINGS_HUB_SOURCES_INTRO =
  "Use these follow-ups when administration scope turns into access control, assurance cites, or operational health checks.";

/** Operator Sources — no self-href to `/administration`. */
export const SETTINGS_HUB_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Security & Trust", href: SETTINGS_SECURITY_TRUST_PATH },
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "Users and roles", href: SETTINGS_USERS_PATH },
  { label: "System health", href: "/administration/system-health" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

/** Orientation-strip Sources — same as operator Sources for the settings hub index. */
export const SETTINGS_HUB_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = SETTINGS_HUB_SOURCES;
