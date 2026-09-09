import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERT_ROUTING_FOLLOW_UPS_TITLE,
  ALERT_ROUTING_ORIENTATION_SOURCES,
  ALERT_ROUTING_SOURCES_INTRO,
} from "@/lib/alert-routing-evidence-copy";

/** Sources follow-ups for `/governance/alert-rules?tab=notifications` (GON). */
export function AlertRoutingClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alert-routing"
      sourcesTestId="alert-routing-sources"
      sourcesTitle={ALERT_ROUTING_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERT_ROUTING_SOURCES_INTRO}
      sources={ALERT_ROUTING_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
