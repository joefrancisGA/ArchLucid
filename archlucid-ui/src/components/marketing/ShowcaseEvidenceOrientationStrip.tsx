import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  SHOWCASE_CLAIM_DISCIPLINE,
  SHOWCASE_SOURCES,
  SHOWCASE_SOURCES_INTRO,
} from "@/lib/showcase-evidence-copy";

/** Evaluation Sources + claim discipline for `/showcase/[runId]` (SRH Evidence). */
export function ShowcaseEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="showcase"
      margin="mt-6"
      align="text-left"
      sourcesIntro={SHOWCASE_SOURCES_INTRO}
      sources={SHOWCASE_SOURCES}
      claimHeading="Illustrative sample only"
      claim={SHOWCASE_CLAIM_DISCIPLINE}
    />
  );
}
