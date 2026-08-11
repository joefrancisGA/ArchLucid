import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { WHY_CLAIM_DISCIPLINE, WHY_SOURCES, WHY_SOURCES_INTRO } from "@/lib/why-evidence-copy";

/** Evaluation Sources + claim discipline for `/why` (WHY Evidence). */
export function WhyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="why"
      margin="mt-6"
      align="text-left"
      sourcesIntro={WHY_SOURCES_INTRO}
      sources={WHY_SOURCES}
      claimHeading="Marketing comparison only"
      claim={WHY_CLAIM_DISCIPLINE}
    />
  );
}
