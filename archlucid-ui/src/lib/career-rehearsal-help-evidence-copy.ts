import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CAREER_REHEARSAL_HELP_CANONICAL_PATH = "/help/career-vs-rehearsal" as const;

export const CAREER_REHEARSAL_HELP_TOPIC_LABEL = "Record vs Practice on the Working desk" as const;

export const CAREER_REHEARSAL_HELP_CLAIM_DISCIPLINE =
  "This topic explains the Working desk review types — it is not a sealed-review diligence Sources package. Open a finalized review or Security & Trust before treating practice copy as procurement evidence.";

export const CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID = "help-career-vs-rehearsal-simulator-honesty" as const;

export const CAREER_REHEARSAL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Architecture desk", href: inAppHelpHref("architecture-desk") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
