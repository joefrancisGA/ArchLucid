import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { securityTrustEvidenceSourcesForProductLine } from "@/lib/product-line/securenow-evidence-navigation";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

export const SECURITY_TRUST_CANONICAL_PATH = "/assurance-status" as const;

export function securityTrustCanonicalPathForProductLine(
  productLineId = resolveProductLineIdFromEnv(),
): string {
  return productLineId === "security" ? SETTINGS_SECURITY_TRUST_PATH : SECURITY_TRUST_CANONICAL_PATH;
}

export const SECURITY_TRUST_CLAIM_DISCIPLINE =
  "This page summarizes public security review progress — not a full audit export, a CPA-issued SOC 2 report, or a published third-party pen-test report. Use Trust Center downloads and NDA channels for materials that actually exist; do not treat marketing status labels as formal certification.";

export const SECURITY_TRUST_SOURCES_INTRO =
  "Use these evaluation links when assurance questions turn into public downloads, privacy, FAQ, or procurement follow-ups.";


/** Architecture-default Sources — use {@link securityTrustSourcesForProductLine} in product-line-aware surfaces. */
export const SECURITY_TRUST_SOURCES: readonly EvidenceSourceLink[] =
  securityTrustEvidenceSourcesForProductLine("architecture");

export function securityTrustSourcesForProductLine(
  productLineId = resolveProductLineIdFromEnv(),
): readonly EvidenceSourceLink[] {
  return securityTrustEvidenceSourcesForProductLine(productLineId);
}
