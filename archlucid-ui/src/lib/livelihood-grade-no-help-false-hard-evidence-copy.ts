import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH } from "@/lib/livelihood-grade-no-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CANONICAL_PATH = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TOPIC_LABEL = "Hard vs soft infeasibility" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CLAIM_DISCIPLINE =
  "This topic explains Working Career feasibility honesty — it is not a sealed-review diligence Sources package. Open the live review feasibility panel, compare hard citations, and Security & Trust before treating help copy as procurement proof." as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SAFETY_HEADING_ID =
  "help-false-hard-infeasibility-citation-before-export" as const;

export const LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Extraction fidelity", href: inAppHelpHref("extraction-fidelity") },
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
