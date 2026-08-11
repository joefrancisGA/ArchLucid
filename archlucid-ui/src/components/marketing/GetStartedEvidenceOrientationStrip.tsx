import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  GET_STARTED_CLAIM_DISCIPLINE,
  GET_STARTED_SOURCES,
  GET_STARTED_SOURCES_INTRO,
} from "@/lib/get-started-evidence-copy";

/** Evaluation Sources + claim discipline for `/get-started` (GXX Evidence). */
export function GetStartedEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="get-started"
      align="text-left"
      sourcesIntro={GET_STARTED_SOURCES_INTRO}
      sources={GET_STARTED_SOURCES}
      claimHeading="First-run orientation only"
      claim={GET_STARTED_CLAIM_DISCIPLINE}
    />
  );
}
