import { howProductWorksTitle, productLineDisplayName } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { securityTrustEvidenceSourcesForProductLine } from "@/lib/product-line/securenow-evidence-navigation";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Hero supporting line for `/assurance-status` — product name only; diligence contact stays ArchLucid security. */
export function assuranceStatusHeroSupporting(productLineId: ProductLineId): string {
  const productName = productLineDisplayName(productLineId);

  return `Review ${productName}'s current assurance posture, public security materials, and due-diligence process.`;
}

/** Legacy hero string retained for length comparisons and architecture-default exports. */
export function securityTrustHeroSupporting(productLineId: ProductLineId): string {
  return assuranceStatusHeroSupporting(productLineId);
}

export function operatorSecurityTrustSubprocessorsWhatItIs(productLineId: ProductLineId): string {
  if (productLineId === "security") {
    return "Third-party subprocessors register for hosted ArchLucid SaaS that delivers SecureNow.";
  }

  return "Third-party subprocessors register for hosted ArchLucid.";
}

export function operatorSecurityTrustNdaRequestHref(productLineId: ProductLineId): string {
  const subject =
    productLineId === "security" ? "SecureNow%20security%20review" : "ArchLucid%20security%20review";

  return `mailto:security@archlucid.net?subject=${subject}`;
}

export function securityTrustEvidenceSources(productLineId: ProductLineId): readonly EvidenceSourceLink[] {
  return securityTrustEvidenceSourcesForProductLine(productLineId);
}
