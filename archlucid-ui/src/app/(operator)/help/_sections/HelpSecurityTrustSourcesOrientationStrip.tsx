import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";

/** Sources-only follow-ups for `/help/security-trust` buyer-polished shell (HSE). */
export function HelpSecurityTrustSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="security-trust-help"
      sourcesTestId="help-security-trust-sources"
      sourcesTitle={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sources={SECURITY_TRUST_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
