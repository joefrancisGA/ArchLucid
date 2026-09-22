import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH } from "@/lib/evidence-source-inspect-help-stored-evidence-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CANONICAL_PATH =
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TOPIC_LABEL =
  "Inspect stored evidence" as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE =
  "This topic explains Evidence source inspect on architecture reviews. Open stored files on a live review and Security & Trust before treating help copy as procurement proof." as const;

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SAFETY_HEADING_ID =
  "help-inspect-stored-evidence-sealed-record-denial" as const;

/** Architecture contextual reference for stored-file inspect help. */
export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTEXTUAL_REFERENCE: EvidenceSourceLink = {
  label: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TOPIC_LABEL,
  href: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH,
};

/** SecureNow contextual reference — inspect-stored-evidence is excluded from the Security shell. */
export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SECURENOW_CONTEXTUAL_REFERENCE: EvidenceSourceLink = {
  label: "Security evidence paths",
  href: inAppHelpHref("security-evidence-paths"),
};

export function resolveEvidenceSourceInspectHelpStoredEvidenceContextualReference(
  productLineId: ProductLineId,
): EvidenceSourceLink {
  if (isSecureNowProductLine(productLineId)) {
    return EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SECURENOW_CONTEXTUAL_REFERENCE;
  }

  return EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTEXTUAL_REFERENCE;
}
