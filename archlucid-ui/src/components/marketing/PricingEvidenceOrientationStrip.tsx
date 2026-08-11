import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  PRICING_CLAIM_DISCIPLINE,
  PRICING_SOURCES,
  PRICING_SOURCES_INTRO,
} from "@/lib/pricing-evidence-copy";

/** Evaluation Sources + claim discipline for `/pricing` (P Evidence). */
export function PricingEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="pricing"
      margin="mb-10"
      sourcesIntro={PRICING_SOURCES_INTRO}
      sources={PRICING_SOURCES}
      claimHeading="Commercial packaging only"
      claim={PRICING_CLAIM_DISCIPLINE}
    />
  );
}
