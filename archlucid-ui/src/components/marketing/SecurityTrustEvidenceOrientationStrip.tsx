import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  SECURITY_TRUST_CLAIM_DISCIPLINE,
  SECURITY_TRUST_SOURCES,
  SECURITY_TRUST_SOURCES_INTRO,
} from "@/lib/security-trust-evidence-copy";

/** Evaluation Sources + claim discipline for `/security-trust` (SEC Evidence). */
export function SecurityTrustEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="security-trust"
      sourcesIntro={SECURITY_TRUST_SOURCES_INTRO}
      sources={SECURITY_TRUST_SOURCES}
      claimHeading="Engagement metadata only"
      claim={SECURITY_TRUST_CLAIM_DISCIPLINE}
    />
  );
}
