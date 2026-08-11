import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE,
  EXAMPLE_ROI_BULLETIN_SOURCES,
  EXAMPLE_ROI_BULLETIN_SOURCES_INTRO,
} from "@/lib/example-roi-bulletin-evidence-copy";

/** Evaluation Sources + claim discipline for `/example-roi-bulletin` (EXA Evidence). */
export function ExampleRoiBulletinEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="example-roi-bulletin"
      margin="mt-6"
      align="text-left"
      sourcesIntro={EXAMPLE_ROI_BULLETIN_SOURCES_INTRO}
      sources={EXAMPLE_ROI_BULLETIN_SOURCES}
      claimHeading="Synthetic sample only"
      claim={EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE}
    />
  );
}
