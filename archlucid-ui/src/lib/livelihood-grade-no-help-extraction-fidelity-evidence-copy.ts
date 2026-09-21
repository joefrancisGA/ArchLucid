import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH } from "@/lib/livelihood-grade-no-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CANONICAL_PATH =
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TOPIC_LABEL = "Extraction fidelity" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_CLAIM_DISCIPLINE =
  "This topic explains extraction and provenance honesty on Working architecture reviews — it is not a sealed-review diligence Sources package. Open stored evidence on the review and Security & Trust before treating help copy as procurement proof.";

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SAFETY_HEADING_ID =
  "help-extraction-fidelity-open-originals" as const;

export const LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Inspect stored evidence", href: inAppHelpHref("inspect-stored-evidence") },
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
