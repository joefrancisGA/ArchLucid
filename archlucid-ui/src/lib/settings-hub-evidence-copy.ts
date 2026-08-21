import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import {
  SETTINGS_ROOT_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_USERS_PATH,
} from "@/lib/settings-admin-route-paths";

export const SETTINGS_HUB_CANONICAL_PATH = SETTINGS_ROOT_PATH;

export const SETTINGS_HUB_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.settingsHub;

export const SETTINGS_HUB_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "administration scope turns into access control, official assurance materials, or operational health checks after using the catalog above",
);

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
