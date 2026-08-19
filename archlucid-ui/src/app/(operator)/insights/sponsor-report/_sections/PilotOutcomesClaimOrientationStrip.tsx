import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PILOT_OUTCOMES_CLAIM_DISCIPLINE,
  PILOT_OUTCOMES_CLAIM_HEADING,
  PILOT_OUTCOMES_FOLLOW_UPS_TITLE,
  PILOT_OUTCOMES_SOURCES,
  PILOT_OUTCOMES_SOURCES_INTRO,
} from "@/lib/pilot-outcomes-evidence-copy";

/** Claim discipline + Sources index for pilot outcomes / sponsor report (IPI). */
export function PilotOutcomesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="pilot-outcomes"
      claim={PILOT_OUTCOMES_CLAIM_DISCIPLINE}
      claimHeading={PILOT_OUTCOMES_CLAIM_HEADING}
      sourcesTitle={PILOT_OUTCOMES_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_OUTCOMES_SOURCES_INTRO}
      sources={PILOT_OUTCOMES_SOURCES}
    />
  );
}
