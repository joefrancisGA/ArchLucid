import type { CitationReference } from "@/types/explanation";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_OPAQUE_TOKEN_PATTERN = /^[a-z0-9]{2,12}(\.{3}|…)?$/i;

/** True when a token looks like an internal id fragment rather than buyer-facing copy. */
export function isOpaqueTechnicalToken(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (UUID_PATTERN.test(trimmed)) {
    return true;
  }

  if (SHORT_OPAQUE_TOKEN_PATTERN.test(trimmed)) {
    return true;
  }

  return false;
}

export type CitationBuyerDisplay = {
  readonly headline: string;
  readonly technicalId: string | null;
};

function stripOpaqueSuffix(label: string): string {
  const segments = label.split(/\s+[—–-]\s+/);

  if (segments.length < 2) {
    return label.trim();
  }

  const lastSegment = segments[segments.length - 1] ?? "";

  if (!isOpaqueTechnicalToken(lastSegment)) {
    return label.trim();
  }

  return segments.slice(0, -1).join(" — ").trim();
}

/** Buyer-facing citation chip copy with technical ids removed from the default label. */
export function formatCitationBuyerDisplay(
  citation: CitationReference,
  buyerPolishedShell: boolean,
): CitationBuyerDisplay {
  const rawLabel = citation.label?.trim() ?? "";
  const cleanedLabel = stripOpaqueSuffix(rawLabel);
  const headline =
    cleanedLabel.length > 0
      ? cleanedLabel
      : citationKindFallbackHeadline(citation.kind);

  if (!buyerPolishedShell) {
    return {
      headline,
      technicalId: citation.id.trim().length > 0 ? citation.id.trim() : null,
    };
  }

  const technicalId = citation.id.trim().length > 0 ? citation.id.trim() : null;

  return {
    headline,
    technicalId: isOpaqueTechnicalToken(headline) ? technicalId : technicalId,
  };
}

function citationKindFallbackHeadline(kind: CitationReference["kind"]): string {
  switch (kind) {
    case "Manifest":
      return SIGNED_MANIFEST_LABEL;
    case "GraphSnapshot":
      return "Evidence graph snapshot";
    case "ContextSnapshot":
      return "Reviewed source context";
    case "DecisionTrace":
      return "Decision trace";
    case "Finding":
      return "Finding";
    case "EvidenceBundle":
      return "Evidence bundle";
    default:
      return "Supporting evidence";
  }
}
