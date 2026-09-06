import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES,
  ALERT_RULES_CONDITIONS_SOURCES_INTRO,
} from "@/lib/alert-rules-conditions-evidence-copy";

/** Sources follow-ups for `/governance/alert-rules?tab=rules` (GLR). */
export function AlertRulesConditionsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alert-rules-conditions"
      sourcesTestId="alert-rules-conditions-sources"
      sourcesTitle={ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERT_RULES_CONDITIONS_SOURCES_INTRO}
      sources={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
