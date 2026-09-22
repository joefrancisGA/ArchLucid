import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** IH-014 — contextual help label for Working inhabit orientation. */

export const INHABIT_THE_ARCHITECTURE_HELP_CANONICAL_PATH = "/help/inhabit-the-architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_TOPIC_LABEL = "Inhabit the architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_CLAIM_DISCIPLINE =
  "This topic orients Working operators on the inhabited architecture desk — it is not a sealed-review diligence Sources package. Open a finalized review or Security & Trust before treating practice copy as procurement evidence.";

export const INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID =
  "help-inhabit-the-architecture-simulator-honesty" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Architecture desk", href: inAppHelpHref("architecture-desk") },
  { label: "Record vs Practice", href: inAppHelpHref("career-vs-rehearsal") },
  { label: "Sealed record vs decision register", href: inAppHelpHref("sealed-record-vs-decision-register") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
