import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PLANNING_CLAIM_DISCIPLINE,
  PLANNING_CLAIM_DISCIPLINE_HEADING,
  PLANNING_SOURCES,
  PLANNING_SOURCES_INTRO,
} from "@/lib/planning-evidence-copy";

/** Claim discipline + Sources index for improvement planning (PLA). */
export function PlanningClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="improvement-planning"
      claim={PLANNING_CLAIM_DISCIPLINE}
      claimHeading={PLANNING_CLAIM_DISCIPLINE_HEADING}
      sourcesIntro={PLANNING_SOURCES_INTRO}
      sources={PLANNING_SOURCES}
    />
  );
}
