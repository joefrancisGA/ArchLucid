import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  TENANT_SETTINGS_CANONICAL_PATH,
  TENANT_SETTINGS_CLAIM_DISCIPLINE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";

export const WORKSPACE_SETTINGS_HELP_CANONICAL_PATH = "/help/workspace-settings" as const;

export const WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace and tenant settings — it is not a sealed-review diligence Sources package.";

export const WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const WORKSPACE_SETTINGS_HELP_SOURCES_INTRO = TENANT_SETTINGS_SOURCES_INTRO;

export const WORKSPACE_SETTINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Workspace settings", href: TENANT_SETTINGS_CANONICAL_PATH },
  { label: "Projects recycle bin", href: "/administration/workspace-settings/recycle-bin" },
  { label: "Workspace and scope help", href: "/help/scope" },
  { label: "Digests schedule", href: "/architecture/digests?tab=schedule" },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const WORKSPACE_SETTINGS_HELP_OPERATOR_CLAIM = TENANT_SETTINGS_CLAIM_DISCIPLINE;
