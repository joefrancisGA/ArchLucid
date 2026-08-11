import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { TRY_CLAIM_DISCIPLINE, TRY_SOURCES, TRY_SOURCES_INTRO } from "@/lib/try-evidence-copy";

/** Evaluation Sources + claim discipline for `/try` (TRY Evidence). */
export function TryEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="try"
      margin="mt-6"
      align="text-left"
      sourcesIntro={TRY_SOURCES_INTRO}
      sources={TRY_SOURCES}
      claimHeading="Illustrative sample only"
      claim={TRY_CLAIM_DISCIPLINE}
    />
  );
}
