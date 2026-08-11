import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  TRUST_CENTER_CLAIM_DISCIPLINE,
  TRUST_CENTER_SOURCES,
  TRUST_CENTER_SOURCES_INTRO,
} from "@/lib/trust-center-evidence-copy";

/** Evaluation Sources + claim discipline for `/trust` (TXX Evidence). */
export function TrustCenterEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="trust-center"
      sourcesIntro={TRUST_CENTER_SOURCES_INTRO}
      sources={TRUST_CENTER_SOURCES}
      claimHeading="Public assurance posture only"
      claim={TRUST_CENTER_CLAIM_DISCIPLINE}
    />
  );
}
