import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_FOLLOW_UPS_TITLE,
  ARCHITECTURE_SCORECARD_SOURCES,
  ARCHITECTURE_SCORECARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-scorecard-evidence-copy";

/** Claim discipline + Sources index for architecture scorecard (SCX). */
export function ArchitectureScorecardClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-scorecard"
      claim={ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={ARCHITECTURE_SCORECARD_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_SCORECARD_SOURCES_INTRO}
      sources={ARCHITECTURE_SCORECARD_SOURCES}
    />
  );
}
