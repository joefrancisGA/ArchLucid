import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  CREATE_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
  parseArchitectureDraftIdFromPath,
} from "@/lib/architecture/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE =
  "Editing a saved architecture draft does not start a review — not a full audit export. Open Start a review when the brief is ready for evidence intake.";

export const ARCHITECTURES_DRAFT_SOURCES_INTRO =
  "Use these when the brief is ready for review intake, you want to start another draft, or you need first-run orientation.";

export const ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE = "Where to go next";

/** Operator Sources — no self-href to the open draft or draft inventory (breadcrumb covers the list). */
export const ARCHITECTURES_DRAFT_SOURCES: readonly EvidenceSourceLink[] = [
  { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export const ARCHITECTURES_DRAFT_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Architecture draft workspace - refine a saved system brief before filing evidence for an approval review.",
  whatToDoNext:
    "Update the draft fields, save when ready, then open Start a review when the brief is ready for evidence intake.",
  whyEmpty: "Draft fields load from the architectures API for this id; empty fields mean the draft has no content yet.",
  whereToConfigurePrerequisite:
    "Drafting uses the workspace and project selected in the header switcher; saving a draft does not start a review.",
} as const;

/** True when the path is a saved architecture draft detail (not list or create-bootstrap). */
export function pathIsArchitectureDraftDetail(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0] ?? "";

  return parseArchitectureDraftIdFromPath(path) !== null;
}
