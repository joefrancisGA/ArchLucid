import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";

/** Sources-only follow-ups for `/help/model-governance` buyer-polished shell (HMO). */
export function HelpModelGovernanceSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-model-governance"
      sourcesTestId="help-model-governance-sources"
      sourcesTitle={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
