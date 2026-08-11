import {
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
  ARCHITECTURE_DRAFTS_LIST_LABEL,
  CREATE_ARCHITECTURE_LABEL,
} from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_NEW_PATH,
  parseArchitectureDraftIdFromPath,
} from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE =
  "Editing a saved architecture draft does not start a review - this page is drafting-first workspace, not a signed-review diligence Sources package. Open Start a review when the brief is ready for evidence intake.";

export const ARCHITECTURES_DRAFT_SOURCES_INTRO =
  "Use these follow-ups when a draft needs the architectures list, create-bootstrap, review intake, or first-run orientation.";


/** Operator Sources - no self-href to the open draft id. */
export const ARCHITECTURES_DRAFT_SOURCES: readonly EvidenceSourceLink[] = [
  { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: ARCHITECTURES_LIST_PATH },
  { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export const ARCHITECTURES_DRAFT_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Architecture draft workspace - refine a saved system brief before filing evidence for a governance review.",
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
