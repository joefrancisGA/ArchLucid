import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { SEE_IT_CLAIM_DISCIPLINE, SEE_IT_SOURCES, SEE_IT_SOURCES_INTRO } from "@/lib/see-it-evidence-copy";

/** Evaluation Sources + claim discipline for `/see-it` (SEE Evidence). */
export function SeeItEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="see-it"
      margin="mt-10"
      align="text-left"
      sourcesIntro={SEE_IT_SOURCES_INTRO}
      sources={SEE_IT_SOURCES}
      claimHeading="Illustrative sample only"
      claim={SEE_IT_CLAIM_DISCIPLINE}
    />
  );
}
