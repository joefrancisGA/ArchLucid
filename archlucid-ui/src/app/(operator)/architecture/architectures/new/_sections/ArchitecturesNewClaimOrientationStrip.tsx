import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { ARCHITECTURES_NEW_CLAIM_HEADING } from "@/lib/architectures-new-page-copy";
import {
  ARCHITECTURES_NEW_CLAIM_DISCIPLINE,
  ARCHITECTURES_NEW_SOURCES,
  ARCHITECTURES_NEW_SOURCES_INTRO,
} from "@/lib/architectures-new-evidence-copy";

/** Claim discipline + Sources index for architecture create-bootstrap (ANE). */
export function ArchitecturesNewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architectures-new"
      claim={ARCHITECTURES_NEW_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURES_NEW_CLAIM_HEADING}
      sourcesIntro={ARCHITECTURES_NEW_SOURCES_INTRO}
      sources={ARCHITECTURES_NEW_SOURCES}
    />
  );
}
