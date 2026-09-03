import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERT_RULES_FOLLOW_UPS_TITLE,
  ALERT_RULES_SOURCES,
  ALERT_RULES_SOURCES_INTRO,
} from "@/lib/alert-rules-evidence-copy";

/** Sources follow-ups for `/governance/alert-rules` (GOT and sibling tabs). */
export function AlertRulesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alert-rules-hub"
      sourcesTestId="alert-rules-hub-sources"
      sourcesTitle={ALERT_RULES_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERT_RULES_SOURCES_INTRO}
      sources={ALERT_RULES_SOURCES}
    />
  );
}
