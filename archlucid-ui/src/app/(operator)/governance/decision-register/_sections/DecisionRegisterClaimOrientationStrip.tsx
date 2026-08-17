import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DECISION_REGISTER_CLAIM_DISCIPLINE,
  DECISION_REGISTER_SOURCES,
  DECISION_REGISTER_SOURCES_INTRO,
} from "@/lib/decision-register-evidence-copy";

import { DECISION_REGISTER_CLAIM_HEADING } from "../decision-register-copy";

/** Claim discipline + Sources index for the decision register (GDO). */
export function DecisionRegisterClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="decision-register"
      claim={DECISION_REGISTER_CLAIM_DISCIPLINE}
      claimHeading={DECISION_REGISTER_CLAIM_HEADING}
      sourcesIntro={DECISION_REGISTER_SOURCES_INTRO}
      sources={DECISION_REGISTER_SOURCES}
    />
  );
}
