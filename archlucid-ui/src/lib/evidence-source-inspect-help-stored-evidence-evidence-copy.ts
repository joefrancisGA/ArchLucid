import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH } from "@/lib/evidence-source-inspect-help-stored-evidence-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CANONICAL_PATH =
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TOPIC_LABEL =
  "Inspect stored evidence" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE =
  "This topic explains Evidence source inspect on architecture reviews — it is not a sealed-review diligence Sources package. Open stored files on a live review and Security & Trust before treating help copy as procurement proof." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID =
  "help-inspect-stored-evidence-sealed-record-denial" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Evidence intake", href: inAppHelpHref("evidence-intake") },
  { label: "Extraction fidelity", href: inAppHelpHref("extraction-fidelity") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
