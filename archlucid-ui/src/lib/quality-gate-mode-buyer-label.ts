import {
  STRICT_AI_QUALITY_MODE_BUYER_LABEL,
  WARN_ONLY_QUALITY_MODE_BUYER_LABEL,
} from "@/lib/usability/canonical-product-terms";

/**
 * Maps wire agent-output quality-gate mode values to buyer-facing labels.
 * API / config continue to use `PilotStrict` and `WarnOnly`.
 */
export function buyerLabelForQualityGateMode(mode: string | null | undefined): string {
  const trimmed = (mode ?? "").trim();

  if (trimmed.length === 0) {
    return "Unknown quality mode";
  }

  switch (trimmed) {
    case "PilotStrict":
      return STRICT_AI_QUALITY_MODE_BUYER_LABEL;
    case "WarnOnly":
      return WARN_ONLY_QUALITY_MODE_BUYER_LABEL;
    default:
      return trimmed;
  }
}
