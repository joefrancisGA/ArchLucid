import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERT_TEST_ALERTS_FOLLOW_UPS_TITLE,
  ALERT_TEST_ALERTS_ORIENTATION_SOURCES,
  ALERT_TEST_ALERTS_SOURCES_INTRO,
} from "@/lib/alert-test-alerts-evidence-copy";

/** Sources follow-ups for `/governance/alert-rules?tab=test-alerts` (GOT). */
export function AlertTestAlertsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alert-test-alerts"
      sourcesTestId="alert-test-alerts-sources"
      sourcesTitle={ALERT_TEST_ALERTS_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERT_TEST_ALERTS_SOURCES_INTRO}
      sources={ALERT_TEST_ALERTS_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
