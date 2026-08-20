import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const WORKSPACE_SETTINGS_HELP_CANONICAL_PATH = "/help/workspace-settings" as const;

export const WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE =
  "This guide is not the live Workspace settings Admin surface — open Workspace settings to edit tenant defaults. It is not workspace scope selection, and it is not where procurement goes for sealed review record citations. Open Assurance status when procurement needs trust citations beyond this orientation.";

export const WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const WORKSPACE_SETTINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when workspace defaults turn into recycle-bin restore, digest schedules, scope, or assurance status questions.";

/** Help Sources — wrap layout with when captions; scope and assurance live here, not on-surface tiles. */
export const WORKSPACE_SETTINGS_HELP_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Projects recycle bin",
    href: "/administration/workspace-settings/recycle-bin",
    when: "Restore soft-deleted architecture projects when names are free",
  },
  {
    label: "Workspace and scope help",
    href: inAppHelpHref("scope"),
    when: "Read scope guidance when header switcher context is the question",
  },
  {
    label: "Digests schedule",
    href: "/architecture/digests?tab=schedule",
    when: "Configure digest schedules when defaults questions turn into notification timing",
  },
  {
    label: "Assurance status",
    href: "/assurance-status",
    when: "Open assurance status when tenant defaults turn into procurement diligence questions",
  },
] as const;
