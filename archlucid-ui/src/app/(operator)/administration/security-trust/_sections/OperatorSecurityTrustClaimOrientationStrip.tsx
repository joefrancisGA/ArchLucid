import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE,
  SETTINGS_SECURITY_TRUST_SOURCES,
  SETTINGS_SECURITY_TRUST_SOURCES_INTRO,
} from "@/lib/settings-security-trust-evidence-copy";

/** Sources follow-ups for `/administration/security-trust` (WSX). */
export function OperatorSecurityTrustClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="settings-security-trust"
      sourcesTestId="settings-security-trust-sources"
      sourcesTitle={SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE}
      sourcesIntro={SETTINGS_SECURITY_TRUST_SOURCES_INTRO}
      sources={SETTINGS_SECURITY_TRUST_SOURCES}
      hubSecondary
    />
  );
}
