import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";

const PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE = "Follow-up surfaces";

/** Claim discipline + cross-topic follow-ups for `/help/pilot-feedback`. */
export function PilotFeedbackHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-feedback"
      claim={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}
      claimElement="div"
      sourcesTitle={PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_FEEDBACK_HELP_SOURCES_INTRO}
      sources={PILOT_FEEDBACK_HELP_SOURCES}
    />
  );
}
