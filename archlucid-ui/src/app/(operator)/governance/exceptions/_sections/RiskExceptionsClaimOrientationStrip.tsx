import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  RISK_EXCEPTIONS_FOLLOW_UPS_TITLE,
  RISK_EXCEPTIONS_ORIENTATION_SOURCES,
  RISK_EXCEPTIONS_SOURCES_INTRO,
} from "@/lib/risk-exceptions-evidence-copy";

/** Claim discipline + Sources index for the risk exceptions register (GRO). */
export function RiskExceptionsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="risk-exceptions"
      sourcesTitle={RISK_EXCEPTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={RISK_EXCEPTIONS_SOURCES_INTRO}
      sources={RISK_EXCEPTIONS_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
