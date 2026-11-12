"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  RISK_EXCEPTIONS_FOLLOW_UPS_TITLE,
  RISK_EXCEPTIONS_SOURCES_INTRO,
  resolveRiskExceptionsOrientationSources,
} from "@/lib/risk-exceptions-evidence-copy";

/** Claim discipline + Sources index for the risk exceptions register (GRO). */
export function RiskExceptionsClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="risk-exceptions"
      sourcesTitle={RISK_EXCEPTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={RISK_EXCEPTIONS_SOURCES_INTRO}
      sources={resolveRiskExceptionsOrientationSources(productLine)}
      hubSecondary
    />
  );
}
