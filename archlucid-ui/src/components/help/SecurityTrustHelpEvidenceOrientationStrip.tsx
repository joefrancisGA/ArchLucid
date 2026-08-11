import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/security-trust`. */
export function SecurityTrustHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="security-trust-help"
      claim={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sources={SECURITY_TRUST_HELP_SOURCES}
    />
  );
}
