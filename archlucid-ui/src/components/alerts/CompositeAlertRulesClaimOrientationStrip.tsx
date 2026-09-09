import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  COMPOSITE_ALERT_RULES_FOLLOW_UPS_TITLE,
  COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES,
  COMPOSITE_ALERT_RULES_SOURCES_INTRO,
} from "@/lib/composite-alert-rules-evidence-copy";

/** Sources follow-ups for `/governance/alert-rules?tab=advanced-rules` (GOA). */
export function CompositeAlertRulesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="composite-alert-rules"
      sourcesTestId="composite-alert-rules-sources"
      sourcesTitle={COMPOSITE_ALERT_RULES_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPOSITE_ALERT_RULES_SOURCES_INTRO}
      sources={COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
