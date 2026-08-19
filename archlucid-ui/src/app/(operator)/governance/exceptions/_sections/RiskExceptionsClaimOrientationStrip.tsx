import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  RISK_EXCEPTIONS_CLAIM_DISCIPLINE,
  RISK_EXCEPTIONS_SOURCES,
  RISK_EXCEPTIONS_SOURCES_INTRO,
} from "@/lib/risk-exceptions-evidence-copy";

import { RISK_EXCEPTIONS_CLAIM_HEADING } from "../risk-exceptions-page-copy";

/** Claim discipline + Sources index for the risk exceptions register (GRO). */
export function RiskExceptionsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="risk-exceptions"
      claim={RISK_EXCEPTIONS_CLAIM_DISCIPLINE}
      claimHeading={RISK_EXCEPTIONS_CLAIM_HEADING}
      sourcesIntro={RISK_EXCEPTIONS_SOURCES_INTRO}
      sources={RISK_EXCEPTIONS_SOURCES}
    />
  );
}
