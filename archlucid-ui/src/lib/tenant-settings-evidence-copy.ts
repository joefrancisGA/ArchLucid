import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TENANT_SETTINGS_CANONICAL_PATH = "/administration/workspace-settings" as const;

export const WORKSPACE_SETTINGS_HELP_TOPIC_LABEL = "How workspace settings work";

export const TENANT_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const TENANT_SETTINGS_CLAIM_HEADING_ID = "tenant-settings-claim-discipline-heading" as const;

export const TENANT_SETTINGS_CLAIM_DISCIPLINE =
  "This Workspace settings page shows tenant-wide defaults and the active workspace scope — not a signed audit export. Open Projects recycle bin, Digests schedule, or Assurance status when you need restore workflows or official materials.";

export const TENANT_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const TENANT_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when tenant defaults turn into recycle-bin restore, digest schedules, or official assurance materials.";

/** Operator Sources - no self-href to tenant settings. */
export const TENANT_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Projects recycle bin", href: "/administration/workspace-settings/recycle-bin" },
  { label: "Workspace and scope help", href: inAppHelpHref("scope") },
  { label: "Digests schedule", href: "/architecture/digests?tab=schedule" },
  { label: "Users", href: "/administration/users" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
