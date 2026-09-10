import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DECISION_REGISTER_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_ORIENTATION_SOURCES,
  DECISION_REGISTER_SOURCES_INTRO,
} from "@/lib/decision-register-evidence-copy";

/** Claim discipline + Sources index for the decision register (GDO). */
export function DecisionRegisterClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="decision-register"
      sourcesTitle={DECISION_REGISTER_FOLLOW_UPS_TITLE}
      sourcesIntro={DECISION_REGISTER_SOURCES_INTRO}
      sources={DECISION_REGISTER_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
