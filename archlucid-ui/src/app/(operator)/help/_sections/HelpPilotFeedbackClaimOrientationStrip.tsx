import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";

/** Sources follow-ups for `/help/pilot-feedback` (HPE). */
export function HelpPilotFeedbackClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-feedback"
      sourcesTestId="help-pilot-feedback-sources"
      sourcesTitle={PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_FEEDBACK_HELP_SOURCES_INTRO}
      sources={PILOT_FEEDBACK_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}
