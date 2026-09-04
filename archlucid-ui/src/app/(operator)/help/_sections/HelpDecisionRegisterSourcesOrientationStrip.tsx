import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";

/** Sources-only follow-ups for `/help/decision-register` buyer-polished shell (HDE). */
export function HelpDecisionRegisterSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="decision-register-help"
      sourcesTestId="help-decision-register-sources"
      sourcesTitle={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DECISION_REGISTER_HELP_SOURCES_INTRO}
      sources={DECISION_REGISTER_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
