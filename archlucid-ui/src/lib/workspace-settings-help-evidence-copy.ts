import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
export const WORKSPACE_SETTINGS_HELP_CANONICAL_PATH = "/help/workspace-settings" as const;

export const WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace and tenant defaults, quality gates, and cost settings — use it to orient administration work before opening recycle-bin restore, digest schedules, or assurance status follow-ups.";

export const WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const WORKSPACE_SETTINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when workspace defaults turn into recycle-bin restore, digest schedules, or assurance status questions.";

export const WORKSPACE_SETTINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Projects recycle bin", href: "/administration/workspace-settings/recycle-bin" },
  { label: "Workspace and scope help", href: "/help/scope" },
  { label: "Digests schedule", href: "/architecture/digests?tab=schedule" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
