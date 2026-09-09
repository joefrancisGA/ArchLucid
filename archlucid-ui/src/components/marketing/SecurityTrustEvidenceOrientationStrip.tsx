"use client";

import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { securityTrustEvidenceSources } from "@/lib/security-trust-product-copy";
import { SECURITY_TRUST_SOURCES_INTRO } from "@/lib/security-trust-evidence-copy";
import { useProductLine } from "@/components/product-line/ProductLineProvider";

/** Product-line-aware Sources strip for `/assurance-status`. */
export function SecurityTrustEvidenceOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="assurance-status"
      part="sources"
      margin="mt-8"
      sourcesIntro={SECURITY_TRUST_SOURCES_INTRO}
      sources={securityTrustEvidenceSources(productLine)}
      claimHeading=""
      claim=""
    />
  );
}
